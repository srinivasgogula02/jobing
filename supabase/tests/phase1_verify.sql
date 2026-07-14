begin;

do $$
begin
  if not has_function_privilege(
    'service_role',
    'public.oauth_validate_access_token(text,text,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'public',
    'public.oauth_validate_access_token(text,text,text)',
    'EXECUTE'
  ) then
    raise exception 'Access-token validation RPC privileges are unsafe';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'oauth_revoke_before_user_delete' and not tgisinternal
  ) or not exists (
    select 1 from pg_trigger
    where tgname = 'forms_enqueue_before_user_delete' and not tgisinternal
  ) then
    raise exception 'Database user-deletion backstops are missing';
  end if;

  if (select count(*) from pg_constraint
      where conname in (
        'oauth_grants_user_id_fkey',
        'oauth_auth_codes_user_id_fkey',
        'oauth_tokens_user_id_fkey'
      ) and confdeltype = 'c') <> 3 then
    raise exception 'OAuth user foreign keys do not cascade on deletion';
  end if;
end
$$;

insert into public.users (id) values ('phase1_live_user');
insert into public.oauth_clients (client_id, issuer, redirect_uris)
values ('phase1_client', 'https://jobing.site', array['https://client.example/callback']);

insert into public.oauth_auth_codes (
  code_hash, client_id, user_id, redirect_uri, scope,
  code_challenge, expires_at, resource
) values (
  repeat('c', 64), 'phase1_client', 'phase1_live_user',
  'https://client.example/callback', 'mcp', repeat('x', 43),
  clock_timestamp() + interval '5 minutes', 'https://jobing.site/mcp'
);

-- Exercises the time-bounded grant-less compatibility trigger.
insert into public.oauth_tokens (
  access_token_hash, refresh_token_hash, client_id, user_id, scope,
  resource, access_expires_at, refresh_expires_at
) values (
  repeat('a', 64), repeat('b', 64), 'phase1_client', 'phase1_live_user',
  'mcp', 'https://jobing.site/mcp', clock_timestamp() + interval '1 hour',
  clock_timestamp() + interval '1 day'
);

do $$
begin
  if public.oauth_validate_access_token(
    repeat('a', 64), 'https://jobing.site/mcp', 'https://jobing.site'
  ) is null then
    raise exception 'A live access token was not validated';
  end if;
end
$$;

-- Models a pre-Phase-1 webhook instance deleting users directly.
delete from public.users where id = 'phase1_live_user';

do $$
begin
  if exists (select 1 from public.oauth_grants where user_id = 'phase1_live_user')
    or exists (select 1 from public.oauth_tokens where user_id = 'phase1_live_user')
    or exists (select 1 from public.oauth_auth_codes where user_id = 'phase1_live_user')
    or (select count(*) from public.forms_workspace_projection_outbox
        where source_user_id = 'phase1_live_user') <> 1
    or public.oauth_validate_access_token(
      repeat('a', 64), 'https://jobing.site/mcp', 'https://jobing.site'
    ) is not null then
    raise exception 'Direct user deletion did not remove credentials and enqueue one tombstone';
  end if;
end
$$;

-- No application version may mint a token for an identity absent from users.
do $$
begin
  begin
    insert into public.oauth_tokens (
      access_token_hash, client_id, user_id, scope, resource, access_expires_at
    ) values (
      repeat('d', 64), 'phase1_client', 'phase1_missing_user', 'mcp',
      'https://jobing.site/mcp', clock_timestamp() + interval '1 hour'
    );
    raise exception 'Orphan OAuth token insert unexpectedly succeeded';
  exception
    when foreign_key_violation then null;
  end;
end
$$;

-- A token may be downscoped from its grant, never broadened beyond it.
insert into public.users (id) values ('phase1_scope_user');
insert into public.oauth_grants (id, user_id, client_id, scope)
values (
  '11111111-1111-4111-8111-111111111111',
  'phase1_scope_user',
  'phase1_client',
  'forms:read'
);

do $$
begin
  begin
    insert into public.oauth_tokens (
      access_token_hash, client_id, user_id, scope, resource, grant_id,
      access_expires_at
    ) values (
      repeat('e', 64), 'phase1_client', 'phase1_scope_user', 'forms:publish',
      'https://jobing.site/mcp', '11111111-1111-4111-8111-111111111111',
      clock_timestamp() + interval '1 hour'
    );
    raise exception 'Broader token scope unexpectedly succeeded';
  exception
    when foreign_key_violation then null;
  end;
end
$$;

update public.oauth_grants
set scope = 'forms:read forms:publish'
where id = '11111111-1111-4111-8111-111111111111';

insert into public.oauth_tokens (
  access_token_hash, client_id, user_id, scope, resource, grant_id,
  access_expires_at
) values (
  repeat('f', 64), 'phase1_client', 'phase1_scope_user', 'forms:read',
  'https://jobing.site/mcp', '11111111-1111-4111-8111-111111111111',
  clock_timestamp() + interval '1 hour'
);

do $$
begin
  if public.oauth_validate_access_token(
    repeat('f', 64), 'https://jobing.site/mcp', 'https://jobing.site'
  ) ->> 'scope' <> 'forms:read' then
    raise exception 'Legitimate token downscoping was rejected';
  end if;
end
$$;

-- The new RPC inserts the Clerk-keyed event first; the database trigger must
-- recognize it and avoid creating a duplicate tombstone.
insert into public.users (id) values ('phase1_rpc_user');
do $$
begin
  perform public.jobing_delete_user_and_enqueue_forms(
    'phase1_rpc_user', 'phase1-svix-event', 2000
  );
end
$$;

do $$
begin
  if (select count(*) from public.forms_workspace_projection_outbox
      where source_user_id = 'phase1_rpc_user') <> 1 then
    raise exception 'RPC user deletion created duplicate tombstones';
  end if;
end
$$;

rollback;
