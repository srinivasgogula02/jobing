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

-- Connector feedback is available only through its bounded service-role RPC.
do $$
begin
  if not has_function_privilege(
    'service_role',
    'public.submit_connector_feedback(text,text,uuid,text,text,text,text,text,boolean)',
    'EXECUTE'
  ) or has_function_privilege(
    'public',
    'public.submit_connector_feedback(text,text,uuid,text,text,text,text,text,boolean)',
    'EXECUTE'
  ) or has_table_privilege(
    'service_role',
    'public.connector_feedback',
    'SELECT'
  ) or not has_function_privilege(
    'service_role',
    'public.list_connector_feedback(integer)',
    'EXECUTE'
  ) or has_function_privilege(
    'public',
    'public.list_connector_feedback(integer)',
    'EXECUTE'
  ) then
    raise exception 'Connector feedback privileges are unsafe';
  end if;
end
$$;

insert into public.users (id) values ('phase1_feedback_user');
insert into public.oauth_grants (id, user_id, client_id, scope)
values (
  '22222222-2222-4222-8222-222222222222',
  'phase1_feedback_user',
  'phase1_client',
  'pages:write feedback:write'
);

do $$
declare
  first_result jsonb;
  retry_result jsonb;
  item integer;
begin
  first_result := public.submit_connector_feedback(
    'phase1_feedback_user',
    'phase1_client',
    '22222222-2222-4222-8222-222222222222',
    'feedback:phase1-idempotency:v1',
    'missing_capability',
    'job_application',
    'deploy_page',
    'The user needs applicants to upload a resume.',
    true
  );
  retry_result := public.submit_connector_feedback(
    'phase1_feedback_user',
    'phase1_client',
    '22222222-2222-4222-8222-222222222222',
    'feedback:phase1-idempotency:v1',
    'missing_capability',
    'job_application',
    'deploy_page',
    'The user needs applicants to upload a resume.',
    true
  );

  if first_result ->> 'duplicate' <> 'false'
     or retry_result ->> 'duplicate' <> 'true'
     or first_result ->> 'id' <> retry_result ->> 'id'
     or (select count(*) from public.connector_feedback
         where grant_id = '22222222-2222-4222-8222-222222222222') <> 1
     or (select request_count from public.oauth_rate_limit_buckets
         where grant_id = '22222222-2222-4222-8222-222222222222'
           and bucket_key = 'feedback') <> 1 then
    raise exception 'Connector feedback retry was not idempotent';
  end if;

  begin
    perform public.submit_connector_feedback(
      'phase1_feedback_user', 'phase1_client',
      '22222222-2222-4222-8222-222222222222',
      'feedback:phase1-idempotency:v1', 'bug', 'website', null,
      'A different report reused the same operation identifier.', true
    );
    raise exception 'Conflicting connector feedback unexpectedly succeeded';
  exception when raise_exception then
    if sqlerrm <> 'FEEDBACK_IDEMPOTENCY_CONFLICT' then raise; end if;
  end;

  begin
    perform public.submit_connector_feedback(
      'phase1_feedback_user', 'phase1_client',
      '22222222-2222-4222-8222-222222222222',
      'feedback:phase1-private-data:v1', 'bug', 'website', null,
      'Contact owner@example.com about this report.', true
    );
    raise exception 'Private connector feedback unexpectedly succeeded';
  exception when invalid_parameter_value then
    if sqlerrm <> 'CONNECTOR_FEEDBACK_INVALID' then raise; end if;
  end;

  begin
    perform public.submit_connector_feedback(
      'phase1_feedback_user', 'phase1_client',
      '22222222-2222-4222-8222-222222222222',
      'feedback:phase1-unconfirmed:v1', 'idea', 'other', null,
      'The user wants another bounded product capability.', false
    );
    raise exception 'Unconfirmed connector feedback unexpectedly succeeded';
  exception when invalid_parameter_value then
    if sqlerrm <> 'CONNECTOR_FEEDBACK_INVALID' then raise; end if;
  end;

  -- The first unique report used one slot. Nine more succeed; number eleven
  -- is rejected by the separate one-hour feedback bucket.
  for item in 2..10 loop
    perform public.submit_connector_feedback(
      'phase1_feedback_user', 'phase1_client',
      '22222222-2222-4222-8222-222222222222',
      'feedback:phase1-rate-limit:' || item, 'idea', 'other', 'other',
      'The user wants another bounded product capability.', true
    );
  end loop;

  begin
    perform public.submit_connector_feedback(
      'phase1_feedback_user', 'phase1_client',
      '22222222-2222-4222-8222-222222222222',
      'feedback:phase1-rate-limit:11', 'idea', 'other', 'other',
      'The user wants one more bounded product capability.', true
    );
    raise exception 'Connector feedback rate limit unexpectedly succeeded';
  exception when raise_exception then
    if sqlerrm <> 'FEEDBACK_RATE_LIMITED' then raise; end if;
  end;

  if (select count(*) from public.list_connector_feedback(2)) <> 2
     or (select count(*) from public.list_connector_feedback(0)) <> 1 then
    raise exception 'Connector feedback list limit was not clamped';
  end if;

  if exists (
    select 1
    from public.list_connector_feedback(1) as listed
    where to_jsonb(listed) ?| array[
      'user_id', 'client_id', 'grant_id', 'operation_id', 'request_hash', 'updated_at'
    ]
       or not (to_jsonb(listed) ?& array[
         'id', 'kind', 'summary', 'use_case', 'blocked_tool', 'status', 'created_at'
       ])
  ) then
    raise exception 'Connector feedback list exposed unsafe or incomplete fields';
  end if;
end
$$;

do $$
begin
  begin
    perform public.submit_connector_feedback(
      'phase1_scope_user', 'phase1_client',
      '11111111-1111-4111-8111-111111111111',
      'feedback:phase1-missing-scope:v1', 'idea', 'other', null,
      'This grant did not approve product feedback.', true
    );
    raise exception 'A grant without feedback scope unexpectedly succeeded';
  exception when raise_exception then
    if sqlerrm <> 'CONNECTOR_FEEDBACK_UNAUTHORIZED' then raise; end if;
  end;
end
$$;

delete from public.users where id = 'phase1_feedback_user';

do $$
begin
  if exists (
    select 1 from public.connector_feedback
    where user_id = 'phase1_feedback_user'
  ) then
    raise exception 'Account deletion retained connector feedback identity';
  end if;
end
$$;

rollback;
