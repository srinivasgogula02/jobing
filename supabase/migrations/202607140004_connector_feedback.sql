-- Privacy-bounded product feedback submitted through the authenticated MCP
-- connector. Raw prompts, page HTML, form data, contact details, and arbitrary
-- metadata have no columns here by design.

begin;

create table if not exists public.connector_feedback (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null references public.users(id) on delete cascade
               check (length(user_id) between 1 and 256),
  client_id    text not null references public.oauth_clients(client_id) on delete cascade
               check (length(client_id) between 1 and 256),
  grant_id     uuid not null references public.oauth_grants(id) on delete cascade,
  operation_id text not null check (
                 length(operation_id) between 8 and 200
                 and operation_id ~ '^[A-Za-z0-9][A-Za-z0-9._~:/-]*$'
               ),
  request_hash bytea not null check (octet_length(request_hash) = 32),
  kind         text not null check (
                 kind in ('missing_capability', 'bug', 'workflow_friction', 'idea', 'other')
               ),
  use_case     text not null check (
                 use_case in (
                   'website', 'lead_generation', 'job_application',
                   'event_registration', 'survey', 'portfolio', 'form_only', 'other'
                 )
               ),
  blocked_tool text check (
                 blocked_tool is null or blocked_tool in (
                   'create_note', 'deploy_page', 'create_form_draft',
                   'list_forms', 'publish_form', 'other'
                 )
               ),
  user_confirmed boolean not null check (user_confirmed is true),
  summary      text not null check (
                 length(summary) between 2 and 280
                 and summary = btrim(summary)
                 and summary !~ E'[\\r\\n\\t]'
                 and summary !~ '<[^>]*>'
                 and summary !~* '(https?://|www[.])'
                 and summary !~* '[[:alnum:]._%+-]+@[[:alnum:].-]+[.][[:alpha:]]{2,}'
                 and summary !~ E'\\+?[0-9][0-9 ().-]{6,}[0-9]'
                 and summary !~* '(api[ _-]?key|access[ _-]?token|bearer|password|secret)[[:space:]]*[:=]'
               ),
  status       text not null default 'new' check (
                 status in ('new', 'reviewing', 'planned', 'resolved', 'wont_fix', 'spam')
               ),
  created_at   timestamptz not null default clock_timestamp(),
  updated_at   timestamptz not null default clock_timestamp(),
  unique (grant_id, operation_id)
);

create index if not exists connector_feedback_created_idx
  on public.connector_feedback(created_at desc, id desc);
create index if not exists connector_feedback_triage_idx
  on public.connector_feedback(status, kind, created_at desc);
create index if not exists connector_feedback_use_case_idx
  on public.connector_feedback(use_case, created_at desc);

alter table public.connector_feedback enable row level security;

-- No table policy is intentional. All writes cross the bounded RPC below, and
-- a future admin surface must receive a separate aggregate/triage interface.
revoke all on table public.connector_feedback from public, anon, authenticated, service_role;

-- Remove the pre-confirmation development signature if this migration is
-- rehearsed over an interrupted local rollout.
drop function if exists public.submit_connector_feedback(
  text, text, uuid, text, text, text, text, text
);

create or replace function public.submit_connector_feedback(
  p_user_id text,
  p_client_id text,
  p_grant_id uuid,
  p_operation_id text,
  p_kind text,
  p_use_case text,
  p_blocked_tool text,
  p_summary text,
  p_user_confirmed boolean
) returns jsonb
language plpgsql
security definer
-- Supabase installs pgcrypto in `extensions`, while stock PostgreSQL installs
-- it in `public`. Keep both trusted schemas explicit so this RPC works in both
-- environments without depending on the database role's search_path.
set search_path = pg_catalog, public, extensions
as $$
declare
  v_request_hash bytea;
  v_existing public.connector_feedback%rowtype;
  v_created public.connector_feedback%rowtype;
begin
  if p_user_id is null or length(p_user_id) not between 1 and 256
     or p_client_id is null or length(p_client_id) not between 1 and 256
     or p_operation_id is null or length(p_operation_id) not between 8 and 200
     or p_operation_id !~ '^[A-Za-z0-9][A-Za-z0-9._~:/-]*$'
     or p_kind is null or p_kind not in ('missing_capability', 'bug', 'workflow_friction', 'idea', 'other')
     or p_use_case is null or p_use_case not in (
       'website', 'lead_generation', 'job_application',
       'event_registration', 'survey', 'portfolio', 'form_only', 'other'
     )
     or p_blocked_tool is not null and p_blocked_tool not in (
       'create_note', 'deploy_page', 'create_form_draft',
       'list_forms', 'publish_form', 'other'
     )
     or p_user_confirmed is distinct from true
     or p_summary is null or length(p_summary) not between 2 and 280
     or p_summary <> btrim(p_summary)
     or p_summary ~ E'[\\r\\n\\t]'
     or p_summary ~ '<[^>]*>'
     or p_summary ~* '(https?://|www[.])'
     or p_summary ~* '[[:alnum:]._%+-]+@[[:alnum:].-]+[.][[:alpha:]]{2,}'
     or p_summary ~ E'\\+?[0-9][0-9 ().-]{6,}[0-9]'
     or p_summary ~* '(api[ _-]?key|access[ _-]?token|bearer|password|secret)[[:space:]]*[:=]'
  then
    raise exception using errcode = '22023', message = 'CONNECTOR_FEEDBACK_INVALID';
  end if;

  -- Verify all actor provenance in one snapshot. The legacy `mcp` scope never
  -- expands here; only a newly consented canonical feedback:write grant passes.
  if not exists (
    select 1
    from public.oauth_grants as grant_row
    join public.oauth_clients as client
      on client.client_id = grant_row.client_id
    join public.users as app_user
      on app_user.id = grant_row.user_id
    where grant_row.id = p_grant_id
      and grant_row.user_id = p_user_id
      and grant_row.client_id = p_client_id
      and grant_row.revoked_at is null
      and 'feedback:write' = any(regexp_split_to_array(btrim(grant_row.scope), E'\\s+'))
  ) then
    raise exception using errcode = 'P0001', message = 'CONNECTOR_FEEDBACK_UNAUTHORIZED';
  end if;

  v_request_hash := digest(
    convert_to(
      jsonb_build_object(
        'kind', p_kind,
        'useCase', p_use_case,
        'blockedTool', p_blocked_tool,
        'summary', p_summary,
        'userConfirmed', p_user_confirmed
      )::text,
      'UTF8'
    ),
    'sha256'
  );

  -- Serialize one logical report so concurrent retries cannot double-charge
  -- the feedback rate bucket or produce two rows.
  perform pg_advisory_xact_lock(
    hashtextextended(
      p_grant_id::text || ':' || length(p_operation_id)::text || ':' || p_operation_id,
      1947294096
    )
  );

  select * into v_existing
  from public.connector_feedback
  where grant_id = p_grant_id and operation_id = p_operation_id;

  if found then
    if v_existing.request_hash <> v_request_hash then
      raise exception using errcode = 'P0001', message = 'FEEDBACK_IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object(
      'id', v_existing.id,
      'createdAt', v_existing.created_at,
      'duplicate', true
    );
  end if;

  if not public.oauth_consume_rate_limit(p_grant_id, 'feedback', 10, 3600) then
    raise exception using errcode = 'P0001', message = 'FEEDBACK_RATE_LIMITED';
  end if;

  insert into public.connector_feedback (
    user_id, client_id, grant_id, operation_id, request_hash,
    kind, use_case, blocked_tool, summary, user_confirmed
  ) values (
    p_user_id, p_client_id, p_grant_id, p_operation_id, v_request_hash,
    p_kind, p_use_case, p_blocked_tool, p_summary, p_user_confirmed
  ) returning * into v_created;

  return jsonb_build_object(
    'id', v_created.id,
    'createdAt', v_created.created_at,
    'duplicate', false
  );
end
$$;

revoke all on function public.submit_connector_feedback(
  text, text, uuid, text, text, text, text, text, boolean
) from public, anon, authenticated;
grant execute on function public.submit_connector_feedback(
  text, text, uuid, text, text, text, text, text, boolean
) to service_role;

-- Bounded, actor-free triage feed for the server-side admin adapter. Keeping
-- this as the only read interface prevents service_role callers from selecting
-- OAuth provenance and request hashes from the underlying table.
create or replace function public.list_connector_feedback(
  p_limit integer default 30
) returns table (
  id uuid,
  kind text,
  summary text,
  use_case text,
  blocked_tool text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    feedback.id,
    feedback.kind,
    feedback.summary,
    feedback.use_case,
    feedback.blocked_tool,
    feedback.status,
    feedback.created_at
  from public.connector_feedback as feedback
  order by feedback.created_at desc, feedback.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100)
$$;

revoke all on function public.list_connector_feedback(integer)
  from public, anon, authenticated;
grant execute on function public.list_connector_feedback(integer)
  to service_role;

commit;
