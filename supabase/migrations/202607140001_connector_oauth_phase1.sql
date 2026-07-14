-- Jobing connector OAuth Phase 1
--
-- This migration stays in the existing MAIN Supabase project. Forms product
-- data lives in Neon; OAuth clients, grants, and tokens continue to be owned by
-- jobing.site because it remains the single connector authorization server.
--
-- Apply this migration before deploying the matching application code.

begin;

create extension if not exists pgcrypto;

-- Bind every dynamic registration to one canonical authorization-server
-- issuer. The production default keeps pre-Phase-1 instances working during a
-- rolling deploy; matching application code always writes the issuer itself.
alter table public.oauth_clients
  add column if not exists issuer text;

update public.oauth_clients
set issuer = 'https://jobing.site'
where issuer is null;

alter table public.oauth_clients
  alter column issuer set default 'https://jobing.site',
  alter column issuer set not null;

-- A grant is one user approval and one refresh-token family. Revoking it makes
-- every access and refresh token created from that approval unusable.
create table if not exists public.oauth_grants (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  client_id      text not null references public.oauth_clients(client_id) on delete cascade,
  scope          text not null,
  created_at     timestamptz not null default now(),
  last_used_at   timestamptz,
  revoked_at     timestamptz,
  revoked_reason text
);

alter table public.oauth_grants enable row level security;

-- A deliberately short compatibility window lets already-running instances
-- insert their historical grant-less `mcp` tokens while the new deployment
-- rolls out. It is never extended on a migration retry and fails closed after
-- 24 hours. Operators should close it as soon as the deployment is healthy.
create table if not exists public.oauth_rollout_guards (
  guard_name    text primary key,
  enabled_until timestamptz not null,
  created_at    timestamptz not null default now()
);

insert into public.oauth_rollout_guards (guard_name, enabled_until)
values ('legacy_grant_bridge', clock_timestamp() + interval '24 hours')
on conflict (guard_name) do nothing;

alter table public.oauth_rollout_guards enable row level security;

-- Existing rows predate RFC 8707 resource binding and token-family grants.
alter table public.oauth_auth_codes
  add column if not exists resource text;

alter table public.oauth_tokens
  add column if not exists resource text,
  add column if not exists grant_id uuid,
  add column if not exists rotated_at timestamptz,
  add column if not exists revoked_reason text;

update public.oauth_auth_codes
set resource = 'https://jobing.site/mcp'
where resource is null;

update public.oauth_tokens
set resource = 'https://jobing.site/mcp'
where resource is null;

alter table public.oauth_auth_codes
  alter column resource set default 'https://jobing.site/mcp',
  alter column resource set not null;

alter table public.oauth_tokens
  alter column resource set default 'https://jobing.site/mcp',
  alter column resource set not null;

-- Expired codes are disposable. Any remaining code/token whose Clerk user is
-- absent from the main user ledger needs an explicit Clerk audit before this
-- migration may reactivate it through a grant backfill.
delete from public.oauth_auth_codes where expires_at <= clock_timestamp();

do $$
begin
  if exists (
    select 1
    from public.oauth_tokens as token
    left join public.users as app_user on app_user.id = token.user_id
    where app_user.id is null
  ) or exists (
    select 1
    from public.oauth_auth_codes as code
    left join public.users as app_user on app_user.id = code.user_id
    where app_user.id is null
  ) then
    raise exception 'Unsafe OAuth backfill: credentials reference users absent from public.users; audit them against Clerk before retrying';
  end if;
end
$$;

-- Repair any historical orphan client identifiers before adding foreign keys.
insert into public.oauth_clients (client_id, issuer, redirect_uris, client_name, token_endpoint_auth_method)
select source.client_id, 'https://jobing.site', '{}', 'Legacy MCP client', 'none'
from (
  select client_id from public.oauth_auth_codes
  union
  select client_id from public.oauth_tokens
) as source
where not exists (
  select 1 from public.oauth_clients clients where clients.client_id = source.client_id
);

-- Backfill one synthetic legacy grant per user/client pair. Historical `mcp`
-- scope remains stored as-is and is mapped by the application to note/page
-- permissions only. Any other grant-less scope means the database is in an
-- unexpected partial-rollout state, so abort for manual review instead of
-- guessing which permissions belong to one token family.
do $$
declare
  item record;
  new_grant_id uuid;
begin
  if exists (
    select 1
    from public.oauth_tokens
    where grant_id is null
      and scope is distinct from 'mcp'
  ) then
    raise exception 'Unsafe OAuth backfill: grant-less tokens contain a non-legacy scope';
  end if;

  for item in
    select
      user_id,
      client_id,
      (array_agg(scope order by created_at desc))[1] as scope,
      min(created_at) as created_at
    from public.oauth_tokens
    where grant_id is null
      and scope = 'mcp'
    group by user_id, client_id
  loop
    insert into public.oauth_grants (user_id, client_id, scope, created_at)
    values (item.user_id, item.client_id, item.scope, item.created_at)
    returning id into new_grant_id;

    update public.oauth_tokens
    set grant_id = new_grant_id
    where grant_id is null
      and user_id = item.user_id
      and client_id = item.client_id
      and scope = 'mcp';
  end loop;
end
$$;

-- Rolling-deploy bridge: the pre-Phase-1 application inserts oauth_tokens
-- without grant_id. Attach those rows to the newest compatible active grant so
-- applying this migration does not interrupt connectors while Vercel replaces
-- old instances. New code always supplies grant_id and bypasses this branch.
create or replace function public.oauth_tokens_assign_legacy_grant()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  -- This trigger runs for every token insert, including old application
  -- instances during the compatibility window. Never let a deleted or
  -- otherwise unknown Clerk identity regain credentials.
  if not exists (select 1 from public.users where id = new.user_id) then
    raise exception 'OAuth tokens require a live Jobing user'
      using errcode = '23503';
  end if;

  if new.grant_id is null then
    if new.scope is distinct from 'mcp' then
      raise exception 'Legacy OAuth grant bridge only accepts the historical mcp scope'
        using errcode = '23514';
    end if;

    if not exists (
      select 1
      from public.oauth_rollout_guards guards
      where guards.guard_name = 'legacy_grant_bridge'
        and guards.enabled_until > clock_timestamp()
    ) then
      raise exception 'Legacy OAuth grant bridge is closed; deploy code that supplies grant_id'
        using errcode = '23514';
    end if;

    select grants.id into new.grant_id
    from public.oauth_grants grants
    where grants.user_id = new.user_id
      and grants.client_id = new.client_id
      and grants.scope = new.scope
      and grants.revoked_at is null
    order by grants.created_at desc
    limit 1;

    if new.grant_id is null then
      insert into public.oauth_grants (user_id, client_id, scope)
      values (new.user_id, new.client_id, new.scope)
      returning id into new.grant_id;
    end if;
  end if;

  if not exists (
    select 1
    from public.oauth_grants grants
    where grants.id = new.grant_id
      and grants.user_id = new.user_id
      and grants.client_id = new.client_id
      and grants.revoked_at is null
      and string_to_array(
        case when new.scope = 'mcp' then 'notes:write pages:write' else new.scope end,
        ' '
      ) <@ string_to_array(
        case when grants.scope = 'mcp' then 'notes:write pages:write' else grants.scope end,
        ' '
      )
  ) then
    raise exception 'OAuth token grant provenance or scope is invalid'
      using errcode = '23503';
  end if;

  return new;
end
$$;

drop trigger if exists oauth_tokens_assign_legacy_grant on public.oauth_tokens;
create trigger oauth_tokens_assign_legacy_grant
before insert on public.oauth_tokens
for each row execute function public.oauth_tokens_assign_legacy_grant();

alter table public.oauth_tokens
  alter column grant_id set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'oauth_auth_codes_client_id_fkey') then
    alter table public.oauth_auth_codes
      add constraint oauth_auth_codes_client_id_fkey
      foreign key (client_id) references public.oauth_clients(client_id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'oauth_tokens_client_id_fkey') then
    alter table public.oauth_tokens
      add constraint oauth_tokens_client_id_fkey
      foreign key (client_id) references public.oauth_clients(client_id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'oauth_tokens_grant_id_fkey') then
    alter table public.oauth_tokens
      add constraint oauth_tokens_grant_id_fkey
      foreign key (grant_id) references public.oauth_grants(id) on delete cascade;
  end if;

  -- These real parent-row invariants serialize concurrent token/code/grant
  -- issuance with account deletion. If issuance wins, DELETE waits and then
  -- cascades it; if deletion wins, the child insert fails.
  if not exists (select 1 from pg_constraint where conname = 'oauth_grants_user_id_fkey') then
    alter table public.oauth_grants
      add constraint oauth_grants_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'oauth_auth_codes_user_id_fkey') then
    alter table public.oauth_auth_codes
      add constraint oauth_auth_codes_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'oauth_tokens_user_id_fkey') then
    alter table public.oauth_tokens
      add constraint oauth_tokens_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;
end
$$;

create unique index if not exists oauth_tokens_access_hash_uq
  on public.oauth_tokens(access_token_hash);

create unique index if not exists oauth_tokens_refresh_hash_uq
  on public.oauth_tokens(refresh_token_hash)
  where refresh_token_hash is not null;

create index if not exists oauth_grants_user_active_idx
  on public.oauth_grants(user_id, created_at desc)
  where revoked_at is null;

create index if not exists oauth_tokens_grant_idx
  on public.oauth_tokens(grant_id);

-- Validate every authorization-code binding before consuming it. Token and
-- grant creation happen in the same transaction, so a failed insert restores
-- the code and never leaves a half-issued grant.
create or replace function public.oauth_exchange_authorization_code(
  p_code_hash text,
  p_client_id text,
  p_redirect_uri text,
  p_code_challenge text,
  p_resource text,
  p_access_token_hash text,
  p_refresh_token_hash text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  code_row public.oauth_auth_codes%rowtype;
  new_grant_id uuid;
begin
  delete from public.oauth_auth_codes
  where code_hash = p_code_hash
    and client_id = p_client_id
    and redirect_uri = p_redirect_uri
    and code_challenge_method = 'S256'
    and code_challenge = p_code_challenge
    and resource = p_resource
    and expires_at > clock_timestamp()
  returning * into code_row;

  if not found then
    return null;
  end if;

  if not exists (select 1 from public.users where id = code_row.user_id) then
    return null;
  end if;

  insert into public.oauth_grants (user_id, client_id, scope)
  values (code_row.user_id, code_row.client_id, code_row.scope)
  returning id into new_grant_id;

  insert into public.oauth_tokens (
    access_token_hash,
    refresh_token_hash,
    client_id,
    user_id,
    scope,
    resource,
    grant_id,
    access_expires_at,
    refresh_expires_at
  ) values (
    p_access_token_hash,
    p_refresh_token_hash,
    code_row.client_id,
    code_row.user_id,
    code_row.scope,
    code_row.resource,
    new_grant_id,
    clock_timestamp() + interval '1 hour',
    clock_timestamp() + interval '30 days'
  );

  return jsonb_build_object(
    'client_id', code_row.client_id,
    'scope', code_row.scope,
    'grant_id', new_grant_id
  );
end
$$;

-- Rotate refresh tokens atomically. Reuse of a token previously rotated by a
-- matching client/resource revokes the complete grant, including its newest
-- access token. This is the token-family theft signal.
create or replace function public.oauth_rotate_refresh_token(
  p_refresh_token_hash text,
  p_client_id text,
  p_resource text,
  p_requested_scope text,
  p_new_access_token_hash text,
  p_new_refresh_token_hash text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  token_grant_id uuid;
  token_row public.oauth_tokens%rowtype;
  grant_row public.oauth_grants%rowtype;
  effective_scope text;
  next_scope text;
begin
  select grant_id into token_grant_id
  from public.oauth_tokens
  where refresh_token_hash = p_refresh_token_hash;

  if not found then
    return null;
  end if;

  select * into grant_row
  from public.oauth_grants
  where id = token_grant_id
  for update;

  select * into token_row
  from public.oauth_tokens
  where refresh_token_hash = p_refresh_token_hash
  for update;

  if not found
    or token_row.client_id <> p_client_id
    or token_row.resource <> p_resource
    or grant_row.revoked_at is not null
  then
    return null;
  end if;

  if token_row.is_revoked then
    if token_row.revoked_reason = 'rotated' then
      update public.oauth_grants
      set revoked_at = clock_timestamp(), revoked_reason = 'refresh_token_reuse'
      where id = token_row.grant_id and revoked_at is null;

      update public.oauth_tokens
      set is_revoked = true,
          revoked_reason = coalesce(revoked_reason, 'refresh_token_reuse')
      where grant_id = token_row.grant_id;
    end if;
    return null;
  end if;

  if token_row.refresh_expires_at is null or token_row.refresh_expires_at <= clock_timestamp() then
    return null;
  end if;

  effective_scope := case
    when token_row.scope = 'mcp' then 'notes:write pages:write'
    else token_row.scope
  end;

  if p_requested_scope is not null
    and not (string_to_array(p_requested_scope, ' ') <@ string_to_array(effective_scope, ' '))
  then
    return null;
  end if;

  next_scope := coalesce(p_requested_scope, token_row.scope);

  update public.oauth_tokens
  set is_revoked = true,
      rotated_at = clock_timestamp(),
      revoked_reason = 'rotated'
  where id = token_row.id;

  insert into public.oauth_tokens (
    access_token_hash,
    refresh_token_hash,
    client_id,
    user_id,
    scope,
    resource,
    grant_id,
    access_expires_at,
    refresh_expires_at
  ) values (
    p_new_access_token_hash,
    p_new_refresh_token_hash,
    token_row.client_id,
    token_row.user_id,
    next_scope,
    token_row.resource,
    token_row.grant_id,
    clock_timestamp() + interval '1 hour',
    clock_timestamp() + interval '30 days'
  );

  update public.oauth_grants
  set last_used_at = clock_timestamp()
  where id = token_row.grant_id;

  return jsonb_build_object(
    'client_id', token_row.client_id,
    'scope', next_scope,
    'grant_id', token_row.grant_id
  );
end
$$;

create or replace function public.oauth_revoke_grant(
  p_grant_id uuid,
  p_user_id text,
  p_reason text default 'user_revoked'
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.oauth_grants
  set revoked_at = coalesce(revoked_at, clock_timestamp()),
      revoked_reason = coalesce(revoked_reason, p_reason)
  where id = p_grant_id
    and user_id = p_user_id;

  if not found then
    return false;
  end if;

  update public.oauth_tokens
  set is_revoked = true,
      revoked_reason = coalesce(revoked_reason, p_reason)
  where grant_id = p_grant_id;

  return true;
end
$$;

create or replace function public.oauth_revoke_all_user_grants(
  p_user_id text
) returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  revoked_count integer;
begin
  with revoked as (
    update public.oauth_grants
    set revoked_at = coalesce(revoked_at, clock_timestamp()),
        revoked_reason = coalesce(revoked_reason, 'account_deleted')
    where user_id = p_user_id
      and revoked_at is null
    returning id
  )
  select count(*)::integer into revoked_count from revoked;

  update public.oauth_tokens
  set is_revoked = true,
      revoked_reason = coalesce(revoked_reason, 'account_deleted')
  where user_id = p_user_id;

  return revoked_count;
end
$$;

-- Resolve an access token in one database snapshot. The live-users join is a
-- defense-in-depth guard if deletion delivery, an old instance, or an operator
-- bypasses the normal revocation path.
create or replace function public.oauth_validate_access_token(
  p_access_token_hash text,
  p_resource text,
  p_issuer text
) returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'user_id', token.user_id,
    'client_id', token.client_id,
    'scope', token.scope,
    'resource', token.resource,
    'grant_id', token.grant_id,
    'access_expires_at', token.access_expires_at
  )
  from public.oauth_tokens as token
  join public.oauth_grants as grant_row
    on grant_row.id = token.grant_id
   and grant_row.user_id = token.user_id
   and grant_row.client_id = token.client_id
   and string_to_array(
     case when token.scope = 'mcp' then 'notes:write pages:write' else token.scope end,
     ' '
   ) <@ string_to_array(
     case when grant_row.scope = 'mcp' then 'notes:write pages:write' else grant_row.scope end,
     ' '
   )
  join public.oauth_clients as client
    on client.client_id = token.client_id
   and client.issuer = p_issuer
  join public.users as app_user
    on app_user.id = token.user_id
  where token.access_token_hash = p_access_token_hash
    and token.resource = p_resource
    and token.is_revoked = false
    and token.access_expires_at > statement_timestamp()
    and grant_row.revoked_at is null
  limit 1
$$;

-- Old application instances delete public.users directly. Keep credential
-- revocation and outstanding-code cleanup inside that same database transaction
-- so a rolling deployment cannot resurrect authorization for the deleted user.
create or replace function public.oauth_revoke_before_user_delete()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  perform public.oauth_revoke_all_user_grants(old.id);
  delete from public.oauth_auth_codes where user_id = old.id;
  return old;
end
$$;

drop trigger if exists oauth_revoke_before_user_delete on public.users;
create trigger oauth_revoke_before_user_delete
before delete on public.users
for each row execute function public.oauth_revoke_before_user_delete();

revoke all on function public.oauth_exchange_authorization_code(text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.oauth_rotate_refresh_token(text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.oauth_revoke_grant(uuid, text, text) from public, anon, authenticated;
revoke all on function public.oauth_revoke_all_user_grants(text) from public, anon, authenticated;
revoke all on function public.oauth_validate_access_token(text, text, text) from public, anon, authenticated;
revoke all on function public.oauth_revoke_before_user_delete() from public, anon, authenticated;
revoke all on function public.oauth_tokens_assign_legacy_grant() from public, anon, authenticated;
revoke all on table public.oauth_rollout_guards from public, anon, authenticated;

grant execute on function public.oauth_exchange_authorization_code(text, text, text, text, text, text, text) to service_role;
grant execute on function public.oauth_rotate_refresh_token(text, text, text, text, text, text) to service_role;
grant execute on function public.oauth_revoke_grant(uuid, text, text) to service_role;
grant execute on function public.oauth_revoke_all_user_grants(text) to service_role;
grant execute on function public.oauth_validate_access_token(text, text, text) to service_role;

commit;
