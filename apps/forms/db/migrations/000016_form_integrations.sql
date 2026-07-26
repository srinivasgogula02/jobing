set role jobing_forms_owner;

create table forms.form_integrations (
  id uuid primary key default public.gen_random_uuid(),
  workspace_id uuid not null,
  form_id uuid not null,
  provider text not null check (provider in (
    'airtable',
    'email',
    'facebook_pixel',
    'google_analytics',
    'google_drive',
    'google_sheets',
    'hubspot',
    'lark',
    'mailchimp',
    'notion',
    'slack',
    'telegram',
    'webhook',
    'zapier'
  )),
  status text not null default 'active' check (status in ('active', 'paused')),
  config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(config) = 'object' and pg_column_size(config) <= 65536),
  secret_ciphertext text
    check (secret_ciphertext is null or length(secret_ciphertext) between 32 and 131072),
  secret_key_id text
    check (secret_key_id is null or length(secret_key_id) between 1 and 128),
  created_by_actor_id text not null check (length(created_by_actor_id) between 1 and 128),
  updated_by_actor_id text not null check (length(updated_by_actor_id) between 1 and 128),
  last_delivery_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_error_code text check (last_error_code is null or length(last_error_code) <= 100),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (workspace_id, form_id, provider),
  foreign key (workspace_id, form_id)
    references forms.forms(workspace_id, id)
    on delete cascade,
  check (
    (secret_ciphertext is null and secret_key_id is null)
    or (secret_ciphertext is not null and secret_key_id is not null)
  )
);

create index form_integrations_form_status_idx
  on forms.form_integrations(workspace_id, form_id, status, provider);

create table forms.integration_deliveries (
  id uuid primary key default public.gen_random_uuid(),
  workspace_id uuid not null,
  form_id uuid not null,
  submission_id uuid not null,
  integration_id uuid not null,
  event_type text not null default 'submission.created'
    check (event_type = 'submission.created'),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'retrying', 'succeeded', 'dead')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 20),
  next_attempt_at timestamptz not null default clock_timestamp(),
  locked_at timestamptz,
  lock_token text check (lock_token is null or length(lock_token) between 8 and 200),
  completed_at timestamptz,
  http_status integer check (http_status is null or http_status between 100 and 599),
  error_code text check (error_code is null or length(error_code) <= 100),
  error_message text check (error_message is null or length(error_message) <= 500),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (submission_id, integration_id, event_type),
  foreign key (submission_id) references forms.submissions(id) on delete cascade,
  foreign key (integration_id) references forms.form_integrations(id) on delete cascade,
  foreign key (workspace_id, form_id)
    references forms.forms(workspace_id, id)
    on delete cascade
);

create index integration_deliveries_claim_idx
  on forms.integration_deliveries(status, next_attempt_at, created_at)
  where status in ('pending', 'retrying', 'processing');

create index integration_deliveries_integration_idx
  on forms.integration_deliveries(integration_id, created_at desc, id desc);

create function forms_private.enqueue_submission_integrations()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  insert into forms.integration_deliveries(
    workspace_id,
    form_id,
    submission_id,
    integration_id
  )
  select
    new.workspace_id,
    new.form_id,
    new.id,
    integration.id
  from forms.form_integrations integration
  where integration.workspace_id = new.workspace_id
    and integration.form_id = new.form_id
    and integration.status = 'active'
    and integration.provider not in ('google_analytics', 'facebook_pixel')
  on conflict (submission_id, integration_id, event_type) do nothing;

  return new;
end
$function$;

create trigger submissions_enqueue_integrations
after insert on forms.submissions
for each row execute function forms_private.enqueue_submission_integrations();

create function forms_api.list_form_integrations(
  p_actor_id text,
  p_form_id uuid
) returns setof jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select jsonb_build_object(
    'id', integration.id,
    'formId', integration.form_id,
    'provider', integration.provider,
    'status', integration.status,
    'config', integration.config,
    'hasSecret', integration.secret_ciphertext is not null,
    'lastDeliveryAt', integration.last_delivery_at,
    'lastSuccessAt', integration.last_success_at,
    'lastFailureAt', integration.last_failure_at,
    'lastErrorCode', integration.last_error_code,
    'pendingDeliveries', (
      select count(*)::integer
      from forms.integration_deliveries delivery
      where delivery.integration_id = integration.id
        and delivery.status in ('pending', 'processing', 'retrying')
    ),
    'failedDeliveries', (
      select count(*)::integer
      from forms.integration_deliveries delivery
      where delivery.integration_id = integration.id
        and delivery.status = 'dead'
    ),
    'updatedAt', integration.updated_at
  )
  from forms.form_integrations integration
  join forms.workspace_memberships membership
    on membership.workspace_id = integration.workspace_id
   and membership.actor_id = p_actor_id
   and membership.status = 'active'
  where integration.form_id = p_form_id
  order by integration.provider, integration.created_at
$function$;

create function forms_api.upsert_form_integration(
  p_actor_id text,
  p_form_id uuid,
  p_provider text,
  p_config jsonb,
  p_secret_ciphertext text,
  p_secret_key_id text,
  p_replace_secret boolean
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_context record;
  v_integration forms.form_integrations%rowtype;
begin
  if length(p_actor_id) not between 1 and 128
     or p_provider not in (
       'airtable',
       'email',
       'facebook_pixel',
       'google_analytics',
       'google_drive',
       'google_sheets',
       'hubspot',
       'lark',
       'mailchimp',
       'notion',
       'slack',
       'telegram',
       'webhook',
       'zapier'
     )
     or jsonb_typeof(p_config) <> 'object'
     or pg_column_size(p_config) > 65536
     or (
       p_replace_secret
       and (
         p_secret_ciphertext is null
         or length(p_secret_ciphertext) not between 32 and 131072
         or p_secret_key_id is null
         or length(p_secret_key_id) not between 1 and 128
       )
     ) then
    raise exception using errcode = '22023', message = 'INVALID_INTEGRATION';
  end if;

  select *
    into v_context
  from forms_private.dashboard_form_context(p_actor_id, p_form_id);

  if not found or v_context.member_role not in ('owner', 'admin', 'editor') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  if p_provider in (
       'airtable',
       'google_drive',
       'google_sheets',
       'hubspot',
       'lark',
       'mailchimp',
       'notion',
       'slack',
       'telegram',
       'webhook',
       'zapier'
     )
     and not p_replace_secret
     and not exists (
       select 1
       from forms.form_integrations existing
       where existing.workspace_id = v_context.workspace_id
         and existing.form_id = p_form_id
         and existing.provider = p_provider
         and existing.secret_ciphertext is not null
         and existing.secret_key_id is not null
     ) then
    raise exception using errcode = '22023', message = 'INTEGRATION_CREDENTIALS_REQUIRED';
  end if;

  insert into forms.form_integrations(
    workspace_id,
    form_id,
    provider,
    status,
    config,
    secret_ciphertext,
    secret_key_id,
    created_by_actor_id,
    updated_by_actor_id
  ) values (
    v_context.workspace_id,
    p_form_id,
    p_provider,
    'active',
    p_config,
    case when p_replace_secret then p_secret_ciphertext else null end,
    case when p_replace_secret then p_secret_key_id else null end,
    p_actor_id,
    p_actor_id
  )
  on conflict (workspace_id, form_id, provider) do update
    set config = excluded.config,
        status = 'active',
        secret_ciphertext = case
          when p_replace_secret then excluded.secret_ciphertext
          else forms.form_integrations.secret_ciphertext
        end,
        secret_key_id = case
          when p_replace_secret then excluded.secret_key_id
          else forms.form_integrations.secret_key_id
        end,
        updated_by_actor_id = p_actor_id,
        updated_at = clock_timestamp()
  returning * into v_integration;

  insert into forms_audit.events(
    workspace_id,
    actor_type,
    actor_id,
    action,
    target_type,
    target_id,
    metadata
  ) values (
    v_context.workspace_id,
    'user',
    p_actor_id,
    'form.integration.saved',
    'form_integration',
    v_integration.id::text,
    jsonb_build_object('formId', p_form_id, 'provider', p_provider)
  );

  return jsonb_build_object(
    'id', v_integration.id,
    'formId', v_integration.form_id,
    'provider', v_integration.provider,
    'status', v_integration.status,
    'config', v_integration.config,
    'hasSecret', v_integration.secret_ciphertext is not null,
    'updatedAt', v_integration.updated_at
  );
end
$function$;

create function forms_api.set_form_integration_status(
  p_actor_id text,
  p_form_id uuid,
  p_provider text,
  p_status text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_context record;
  v_changed integer;
begin
  if p_status not in ('active', 'paused') then
    raise exception using errcode = '22023', message = 'INVALID_INTEGRATION_STATUS';
  end if;

  select *
    into v_context
  from forms_private.dashboard_form_context(p_actor_id, p_form_id);

  if not found or v_context.member_role not in ('owner', 'admin', 'editor') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  update forms.form_integrations
  set status = p_status,
      updated_by_actor_id = p_actor_id,
      updated_at = clock_timestamp()
  where workspace_id = v_context.workspace_id
    and form_id = p_form_id
    and provider = p_provider;

  get diagnostics v_changed = row_count;
  return v_changed > 0;
end
$function$;

create function forms_api.delete_form_integration(
  p_actor_id text,
  p_form_id uuid,
  p_provider text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_context record;
  v_changed integer;
begin
  select *
    into v_context
  from forms_private.dashboard_form_context(p_actor_id, p_form_id);

  if not found or v_context.member_role not in ('owner', 'admin', 'editor') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  delete from forms.form_integrations
  where workspace_id = v_context.workspace_id
    and form_id = p_form_id
    and provider = p_provider;

  get diagnostics v_changed = row_count;
  return v_changed > 0;
end
$function$;

create function forms_api.claim_integration_deliveries(
  p_lock_token text,
  p_limit integer default 10,
  p_submission_id uuid default null
) returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  if length(p_lock_token) not between 8 and 200
     or p_limit not between 1 and 25 then
    raise exception using errcode = '22023', message = 'INVALID_DELIVERY_CLAIM';
  end if;

  return query
  with candidates as (
    select delivery.id
    from forms.integration_deliveries delivery
    join forms.form_integrations integration
      on integration.id = delivery.integration_id
     and integration.status = 'active'
    where (
      (
        delivery.status in ('pending', 'retrying')
        and delivery.next_attempt_at <= clock_timestamp()
      ) or (
        delivery.status = 'processing'
        and delivery.locked_at < clock_timestamp() - interval '5 minutes'
      )
    )
    and (p_submission_id is null or delivery.submission_id = p_submission_id)
    order by delivery.next_attempt_at, delivery.created_at, delivery.id
    for update skip locked
    limit p_limit
  ),
  claimed as (
    update forms.integration_deliveries delivery
    set status = 'processing',
        locked_at = clock_timestamp(),
        lock_token = p_lock_token,
        attempt_count = delivery.attempt_count + 1,
        updated_at = clock_timestamp()
    from candidates
    where delivery.id = candidates.id
    returning delivery.*
  )
  select jsonb_build_object(
    'deliveryId', claimed.id,
    'integrationId', integration.id,
    'provider', integration.provider,
    'config', integration.config,
    'secretCiphertext', integration.secret_ciphertext,
    'secretKeyId', integration.secret_key_id,
    'attempt', claimed.attempt_count,
    'form', jsonb_build_object(
      'id', form_row.id,
      'name', form_row.name
    ),
    'submission', jsonb_build_object(
      'id', submission.id,
      'receivedAt', submission.received_at,
      'values', submission.values,
      'origin', submission.origin
    )
  )
  from claimed
  join forms.form_integrations integration on integration.id = claimed.integration_id
  join forms.forms form_row
    on form_row.workspace_id = claimed.workspace_id
   and form_row.id = claimed.form_id
  join forms.submissions submission on submission.id = claimed.submission_id
  where integration.status = 'active';
end
$function$;

create function forms_api.complete_integration_delivery(
  p_lock_token text,
  p_delivery_id uuid,
  p_success boolean,
  p_http_status integer,
  p_error_code text,
  p_error_message text,
  p_retry_at timestamptz
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_delivery forms.integration_deliveries%rowtype;
begin
  if length(p_lock_token) not between 8 and 200
     or (p_http_status is not null and p_http_status not between 100 and 599)
     or (p_error_code is not null and length(p_error_code) > 100)
     or (p_error_message is not null and length(p_error_message) > 500) then
    raise exception using errcode = '22023', message = 'INVALID_DELIVERY_RESULT';
  end if;

  update forms.integration_deliveries
  set status = case
        when p_success then 'succeeded'
        when p_retry_at is not null then 'retrying'
        else 'dead'
      end,
      next_attempt_at = coalesce(p_retry_at, next_attempt_at),
      completed_at = case when p_success or p_retry_at is null then clock_timestamp() else null end,
      http_status = p_http_status,
      error_code = case when p_success then null else p_error_code end,
      error_message = case when p_success then null else p_error_message end,
      locked_at = null,
      lock_token = null,
      updated_at = clock_timestamp()
  where id = p_delivery_id
    and status = 'processing'
    and lock_token = p_lock_token
  returning * into v_delivery;

  if not found then
    return false;
  end if;

  update forms.form_integrations
  set last_delivery_at = clock_timestamp(),
      last_success_at = case when p_success then clock_timestamp() else last_success_at end,
      last_failure_at = case when p_success then last_failure_at else clock_timestamp() end,
      last_error_code = case when p_success then null else p_error_code end,
      updated_at = clock_timestamp()
  where id = v_delivery.integration_id;

  return true;
end
$function$;

create function forms_api.list_integration_submission_files(
  p_submission_id uuid
) returns setof jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select jsonb_build_object(
    'id', file.id,
    'fieldKey', file.field_key,
    'fileName', file.file_name,
    'contentType', file.content_type,
    'byteSize', file.byte_size,
    'scanStatus', file.scan_status,
    'contentBase64', encode(file.content, 'base64')
  )
  from forms.submission_files file
  where file.submission_id = p_submission_id
    and file.scan_status <> 'blocked'
  order by file.created_at, file.id
$function$;

create or replace function forms_api.get_public_form(p_public_id text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select jsonb_build_object(
    'formId', form_row.id,
    'endpointId', endpoint.public_id,
    'versionId', version.id,
    'version', version.version_number,
    'name', form_row.name,
    'definition', version.definition,
    'submissionCount', (
      select count(*)::integer
      from forms.submissions submission
      where submission.workspace_id = form_row.workspace_id
        and submission.form_id = form_row.id
    ),
    'clientIntegrations', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'provider', integration.provider,
          'config', integration.config
        )
        order by integration.provider
      )
      from forms.form_integrations integration
      where integration.workspace_id = form_row.workspace_id
        and integration.form_id = form_row.id
        and integration.status = 'active'
        and integration.provider in ('google_analytics', 'facebook_pixel')
    ), '[]'::jsonb)
  )
  from forms.form_endpoints endpoint
  join forms.forms form_row
    on form_row.workspace_id = endpoint.workspace_id
   and form_row.id = endpoint.form_id
  join forms.form_versions version
    on version.workspace_id = form_row.workspace_id
   and version.form_id = form_row.id
   and version.id = form_row.published_version_id
  where endpoint.public_id = p_public_id
    and endpoint.status in ('active', 'retiring')
    and (endpoint.accept_until is null or endpoint.accept_until >= clock_timestamp())
    and form_row.status = 'published'
$function$;

alter table forms.form_integrations enable row level security;
alter table forms.form_integrations force row level security;
create policy owner_full_access
  on forms.form_integrations
  for all
  to jobing_forms_owner
  using (true)
  with check (true);

alter table forms.integration_deliveries enable row level security;
alter table forms.integration_deliveries force row level security;
create policy owner_full_access
  on forms.integration_deliveries
  for all
  to jobing_forms_owner
  using (true)
  with check (true);

revoke all on forms.form_integrations, forms.integration_deliveries
  from public, jobing_forms_control, jobing_forms_sync, jobing_forms_public,
       jobing_forms_ingest, jobing_forms_worker, jobing_forms_auditor;

revoke execute on function
  forms_private.enqueue_submission_integrations(),
  forms_api.list_form_integrations(text, uuid),
  forms_api.upsert_form_integration(text, uuid, text, jsonb, text, text, boolean),
  forms_api.set_form_integration_status(text, uuid, text, text),
  forms_api.delete_form_integration(text, uuid, text),
  forms_api.claim_integration_deliveries(text, integer, uuid),
  forms_api.complete_integration_delivery(text, uuid, boolean, integer, text, text, timestamptz),
  forms_api.list_integration_submission_files(uuid)
from public, jobing_forms_control, jobing_forms_sync, jobing_forms_public,
     jobing_forms_ingest, jobing_forms_worker, jobing_forms_auditor;

grant execute on function
  forms_api.list_form_integrations(text, uuid),
  forms_api.upsert_form_integration(text, uuid, text, jsonb, text, text, boolean),
  forms_api.set_form_integration_status(text, uuid, text, text),
  forms_api.delete_form_integration(text, uuid, text)
to jobing_forms_control;

grant execute on function
  forms_api.claim_integration_deliveries(text, integer, uuid),
  forms_api.complete_integration_delivery(text, uuid, boolean, integer, text, text, timestamptz),
  forms_api.list_integration_submission_files(uuid)
to jobing_forms_control, jobing_forms_worker;

reset role;
