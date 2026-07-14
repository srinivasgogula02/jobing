-- Durable main-Supabase -> Forms-Neon workspace lifecycle projections.
--
-- Apply after 202607140001_connector_oauth_phase1.sql. The Clerk deletion
-- webhook writes the tombstone and revokes connector credentials in one
-- Supabase transaction. Delivery to Neon is retried independently.

begin;

create table if not exists public.forms_workspace_projection_outbox (
  id              uuid primary key default gen_random_uuid(),
  event_key       text not null unique check (length(event_key) between 8 and 160),
  source_user_id  text not null check (length(source_user_id) between 1 and 128),
  source_version  bigint not null check (source_version > 1),
  payload         jsonb not null check (jsonb_typeof(payload) = 'object'),
  attempts        integer not null default 0 check (attempts >= 0),
  available_at    timestamptz not null default clock_timestamp(),
  lease_token     uuid,
  leased_until    timestamptz,
  delivered_at    timestamptz,
  last_error_code text check (last_error_code is null or length(last_error_code) <= 120),
  created_at      timestamptz not null default clock_timestamp(),
  updated_at      timestamptz not null default clock_timestamp(),
  check ((lease_token is null) = (leased_until is null))
);

alter table public.forms_workspace_projection_outbox enable row level security;

create index if not exists forms_workspace_projection_pending_idx
  on public.forms_workspace_projection_outbox (available_at, created_at)
  where delivered_at is null;

-- A pre-Phase-1 webhook instance may still delete public.users directly during
-- a rolling deployment. If the new RPC has not already queued its Clerk event,
-- synthesize an idempotent tombstone in the same deletion transaction.
create or replace function public.forms_enqueue_before_user_delete()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_event_key text;
  v_source_version bigint := greatest(
    2,
    floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );
  v_payload jsonb;
begin
  if exists (
    select 1
    from public.forms_workspace_projection_outbox
    where source_user_id = old.id
  ) then
    return old;
  end if;

  v_event_key := 'db-user-delete:' || encode(
    public.digest(old.id || chr(31) || txid_current()::text, 'sha256'),
    'hex'
  );
  v_payload := jsonb_build_object(
    'operationId', 'database-delete:' || v_event_key,
    'workspace', jsonb_build_object(
      'sourceWorkspaceId', old.id,
      'kind', 'personal',
      'displayName', 'Deleted workspace',
      'status', 'deleted',
      'sourceVersion', v_source_version
    ),
    'membership', jsonb_build_object(
      'actorId', old.id,
      'role', 'owner',
      'status', 'removed',
      'sourceVersion', v_source_version
    ),
    'entitlement', jsonb_build_object(
      'planKey', 'free',
      'status', 'cancelled',
      'sourceVersion', v_source_version,
      'features', '{}'::jsonb,
      'limits', '{}'::jsonb
    )
  );

  insert into public.forms_workspace_projection_outbox (
    event_key, source_user_id, source_version, payload
  ) values (
    v_event_key, old.id, v_source_version, v_payload
  );

  return old;
end
$$;

drop trigger if exists forms_enqueue_before_user_delete on public.users;
create trigger forms_enqueue_before_user_delete
before delete on public.users
for each row execute function public.forms_enqueue_before_user_delete();

create or replace function public.jobing_delete_user_and_enqueue_forms(
  p_user_id text,
  p_event_key text,
  p_source_version bigint
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_payload jsonb;
  v_existing_user_id text;
  v_existing_source_version bigint;
begin
  if length(p_user_id) not between 1 and 128
     or length(p_event_key) not between 8 and 160
     or p_source_version <= 1 then
    raise exception using errcode = '22023', message = 'INVALID_FORMS_DELETION_EVENT';
  end if;

  v_payload := jsonb_build_object(
    'operationId', 'clerk-delete:' || p_event_key,
    'workspace', jsonb_build_object(
      'sourceWorkspaceId', p_user_id,
      'kind', 'personal',
      'displayName', 'Deleted workspace',
      'status', 'deleted',
      'sourceVersion', p_source_version
    ),
    'membership', jsonb_build_object(
      'actorId', p_user_id,
      'role', 'owner',
      'status', 'removed',
      'sourceVersion', p_source_version
    ),
    'entitlement', jsonb_build_object(
      'planKey', 'free',
      'status', 'cancelled',
      'sourceVersion', p_source_version,
      'features', '{}'::jsonb,
      'limits', '{}'::jsonb
    )
  );

  -- Credential revocation, the main user deletion, and the durable Neon
  -- tombstone enqueue share this transaction. A failure rolls back all three.
  perform public.oauth_revoke_all_user_grants(p_user_id);
  delete from public.oauth_auth_codes where user_id = p_user_id;

  insert into public.forms_workspace_projection_outbox (
    event_key, source_user_id, source_version, payload
  ) values (
    p_event_key, p_user_id, p_source_version, v_payload
  )
  on conflict (event_key) do nothing
  returning payload into v_payload;

  if not found then
    select source_user_id, source_version, payload
    into v_existing_user_id, v_existing_source_version, v_payload
    from public.forms_workspace_projection_outbox
    where event_key = p_event_key;

    if v_existing_user_id is distinct from p_user_id
       or v_existing_source_version is distinct from p_source_version then
      raise exception using errcode = '23505', message = 'FORMS_DELETION_EVENT_CONFLICT';
    end if;
  end if;

  delete from public.users where id = p_user_id;

  return v_payload;
end
$$;

create or replace function public.forms_claim_workspace_projections(
  p_limit integer default 25,
  p_lease_seconds integer default 60
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
begin
  if p_limit not between 1 and 100 or p_lease_seconds not between 15 and 300 then
    raise exception using errcode = '22023', message = 'INVALID_FORMS_OUTBOX_CLAIM';
  end if;

  with candidates as (
    select outbox.id
    from public.forms_workspace_projection_outbox as outbox
    where outbox.delivered_at is null
      and outbox.available_at <= clock_timestamp()
      and (outbox.leased_until is null or outbox.leased_until <= clock_timestamp())
    order by outbox.available_at, outbox.created_at, outbox.id
    for update skip locked
    limit p_limit
  ), claimed as (
    update public.forms_workspace_projection_outbox as outbox
    set attempts = outbox.attempts + 1,
        lease_token = gen_random_uuid(),
        leased_until = clock_timestamp() + make_interval(secs => p_lease_seconds),
        updated_at = clock_timestamp()
    from candidates
    where outbox.id = candidates.id
    returning outbox.id, outbox.event_key, outbox.lease_token, outbox.payload, outbox.attempts
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', claimed.id,
        'eventKey', claimed.event_key,
        'leaseToken', claimed.lease_token,
        'payload', claimed.payload,
        'attempts', claimed.attempts
      ) order by claimed.id
    ),
    '[]'::jsonb
  ) into v_result
  from claimed;

  return v_result;
end
$$;

create or replace function public.forms_ack_workspace_projection(
  p_id uuid,
  p_lease_token uuid
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.forms_workspace_projection_outbox
  set delivered_at = clock_timestamp(),
      lease_token = null,
      leased_until = null,
      last_error_code = null,
      updated_at = clock_timestamp()
  where id = p_id
    and lease_token = p_lease_token
    and delivered_at is null;
  return found;
end
$$;

create or replace function public.forms_ack_workspace_projection_event(
  p_event_key text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.forms_workspace_projection_outbox
  set delivered_at = coalesce(delivered_at, clock_timestamp()),
      lease_token = null,
      leased_until = null,
      last_error_code = null,
      updated_at = clock_timestamp()
  where event_key = p_event_key;
  return found;
end
$$;

create or replace function public.forms_nack_workspace_projection(
  p_id uuid,
  p_lease_token uuid,
  p_error_code text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.forms_workspace_projection_outbox
  set available_at = clock_timestamp() + make_interval(
        secs => least(3600, greatest(15, 15 * (2 ^ least(attempts, 8))::integer))
      ),
      lease_token = null,
      leased_until = null,
      last_error_code = left(coalesce(nullif(p_error_code, ''), 'delivery_failed'), 120),
      updated_at = clock_timestamp()
  where id = p_id
    and lease_token = p_lease_token
    and delivered_at is null;
  return found;
end
$$;

revoke all on table public.forms_workspace_projection_outbox from public, anon, authenticated;
revoke all on function public.jobing_delete_user_and_enqueue_forms(text, text, bigint) from public, anon, authenticated;
revoke all on function public.forms_enqueue_before_user_delete() from public, anon, authenticated;
revoke all on function public.forms_claim_workspace_projections(integer, integer) from public, anon, authenticated;
revoke all on function public.forms_ack_workspace_projection(uuid, uuid) from public, anon, authenticated;
revoke all on function public.forms_ack_workspace_projection_event(text) from public, anon, authenticated;
revoke all on function public.forms_nack_workspace_projection(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.jobing_delete_user_and_enqueue_forms(text, text, bigint) to service_role;
grant execute on function public.forms_claim_workspace_projections(integer, integer) to service_role;
grant execute on function public.forms_ack_workspace_projection(uuid, uuid) to service_role;
grant execute on function public.forms_ack_workspace_projection_event(text) to service_role;
grant execute on function public.forms_nack_workspace_projection(uuid, uuid, text) to service_role;

commit;
