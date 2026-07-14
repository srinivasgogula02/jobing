set role jobing_forms_owner;

create function forms_api.claim_request_nonce(
  p_key_id text,
  p_nonce text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_claimed boolean;
begin
  if length(p_key_id) not between 1 and 128
     or length(p_nonce) not between 16 and 240
     or p_expires_at <= clock_timestamp()
     or p_expires_at > clock_timestamp() + interval '20 minutes' then
    return false;
  end if;

  with expired as (
    select nonces.key_id, nonces.nonce
    from forms_private.request_nonces as nonces
    where nonces.expires_at < clock_timestamp() - interval '1 hour'
    order by nonces.expires_at
    limit 100
  )
  delete from forms_private.request_nonces as nonces
  using expired
  where nonces.key_id = expired.key_id and nonces.nonce = expired.nonce;

  insert into forms_private.request_nonces (key_id, nonce, expires_at)
  values (p_key_id, p_nonce, p_expires_at)
  on conflict do nothing
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end
$function$;

create function forms_api.publish_form(
  p_actor_id text,
  p_form_id uuid,
  p_expected_revision bigint,
  p_operation_id text,
  p_request_hash text,
  p_client_id text,
  p_grant_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_workspace_id uuid;
  v_member_role text;
  v_status text;
  v_version_sequence integer;
  v_published_version_id uuid;
  v_draft forms.form_drafts%rowtype;
  v_existing_hash bytea;
  v_scope_hash bytea;
  v_request_hash bytea;
  v_existing jsonb;
  v_response jsonb;
  v_version_id uuid := public.gen_random_uuid();
  v_next_version integer;
  v_endpoint_id text;
begin
  if length(p_actor_id) not between 1 and 128
     or length(p_client_id) not between 1 and 128
     or p_grant_id is null
     or length(p_operation_id) not between 8 and 200
     or length(p_request_hash) not between 1 and 1048576
     or p_expected_revision <= 0 then
    raise exception using errcode = '22023', message = 'INVALID_PUBLISH_REQUEST';
  end if;

  select form_row.workspace_id, membership.role, form_row.status,
         form_row.version_sequence, form_row.published_version_id
  into v_workspace_id, v_member_role, v_status, v_version_sequence, v_published_version_id
  from forms.forms as form_row
  join forms.workspace_memberships as membership
    on membership.workspace_id = form_row.workspace_id
   and membership.actor_id = p_actor_id
  join forms.workspaces as workspace
    on workspace.id = form_row.workspace_id
  join forms.workspace_entitlements as entitlement
    on entitlement.workspace_id = form_row.workspace_id
  where form_row.id = p_form_id
    and membership.status = 'active'
    and workspace.status = 'active'
    and entitlement.status in ('active', 'grace')
  for update of form_row;

  if v_workspace_id is null then
    if exists (select 1 from forms.forms where id = p_form_id) then
      raise exception using errcode = 'P0001', message = 'FORBIDDEN';
    end if;
    raise exception using errcode = 'P0001', message = 'FORM_NOT_FOUND';
  end if;
  if v_member_role not in ('owner', 'admin', 'editor') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if v_status in ('archived', 'trashed') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  v_scope_hash := public.digest(
    pg_catalog.convert_to(
      p_actor_id || chr(31) || p_client_id || chr(31) || p_grant_id::text || chr(31) || p_form_id::text,
      'UTF8'
    ),
    'sha256'
  );
  v_request_hash := public.digest(pg_catalog.convert_to(p_request_hash, 'UTF8'), 'sha256');
  v_existing := forms_private.begin_idempotency(
    v_scope_hash, 'form.publish', p_operation_id, v_request_hash
  );
  if v_existing is not null then return v_existing; end if;

  select * into v_draft
  from forms.form_drafts
  where workspace_id = v_workspace_id and form_id = p_form_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'FORM_NOT_FOUND';
  end if;
  if v_draft.revision <> p_expected_revision then
    raise exception using errcode = 'P0001', message = 'STALE_REVISION';
  end if;

  select endpoint.public_id into v_endpoint_id
  from forms.form_endpoints as endpoint
  where endpoint.workspace_id = v_workspace_id
    and endpoint.form_id = p_form_id
    and endpoint.status = 'active';

  if v_published_version_id is not null then
    select version.content_hash into v_existing_hash
    from forms.form_versions as version
    where version.workspace_id = v_workspace_id
      and version.form_id = p_form_id
      and version.id = v_published_version_id;
  end if;

  -- Repeating publish with a fresh operation id but an unchanged live draft is
  -- a successful no-op, not a duplicate immutable version.
  if v_status = 'published' and v_existing_hash = v_draft.content_hash then
    v_response := jsonb_build_object(
      'id', p_form_id,
      'status', 'published',
      'revision', v_draft.revision,
      'version', v_version_sequence,
      'endpointId', v_endpoint_id
    );
    perform forms_private.complete_idempotency(
      v_scope_hash, 'form.publish', p_operation_id, v_response, 'form', p_form_id
    );
    return v_response;
  end if;

  if v_version_sequence = 0 then
    perform forms_private.apply_gauge_delta(
      v_workspace_id,
      'forms.published',
      1,
      1,
      'form:publish:' || p_form_id::text,
      'form',
      p_form_id::text,
      'form_published',
      'mcp',
      p_actor_id
    );
  end if;

  v_next_version := v_version_sequence + 1;
  insert into forms.form_versions (
    id, workspace_id, form_id, version_number, schema_version, definition,
    source_draft_revision, published_by_actor_id, publish_reason
  ) values (
    v_version_id, v_workspace_id, p_form_id, v_next_version, v_draft.schema_version, v_draft.definition,
    v_draft.revision, p_actor_id, case when v_version_sequence = 0 then 'initial' else 'update' end
  );

  update forms.forms
  set status = 'published',
      published_version_id = v_version_id,
      version_sequence = v_next_version,
      lock_version = lock_version + 1,
      updated_by_actor_id = p_actor_id,
      updated_at = clock_timestamp(),
      published_at = coalesce(published_at, clock_timestamp()),
      paused_at = null
  where workspace_id = v_workspace_id and id = p_form_id;

  update forms.form_drafts
  set based_on_version_id = v_version_id,
      updated_at = clock_timestamp()
  where workspace_id = v_workspace_id and form_id = p_form_id;

  insert into forms_audit.events (
    workspace_id, actor_type, actor_id, action, target_type, target_id, request_id, metadata
  ) values (
    v_workspace_id, 'mcp', p_actor_id, 'form.published', 'form', p_form_id::text, p_operation_id,
    jsonb_build_object(
      'version', v_next_version,
      'draftRevision', v_draft.revision,
      'clientId', p_client_id,
      'grantId', p_grant_id
    )
  );

  insert into forms_private.outbox_events (
    workspace_id, topic, aggregate_type, aggregate_id, dedupe_key, payload
  ) values (
    v_workspace_id, 'forms.form.published', 'form', p_form_id::text,
    'form:version:' || v_version_id::text,
    jsonb_build_object(
      'workspaceId', v_workspace_id,
      'formId', p_form_id,
      'versionId', v_version_id,
      'version', v_next_version
    )
  );

  v_response := jsonb_build_object(
    'id', p_form_id,
    'status', 'published',
    'revision', v_draft.revision,
    'version', v_next_version,
    'endpointId', v_endpoint_id
  );
  perform forms_private.complete_idempotency(
    v_scope_hash, 'form.publish', p_operation_id, v_response, 'form', p_form_id
  );
  return v_response;
end
$function$;

create function forms_api.apply_workspace_projection(
  p_operation_id text,
  p_request_hash text,
  p_workspace jsonb,
  p_membership jsonb,
  p_entitlement jsonb,
  p_actor_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_source_workspace_id text;
  v_workspace_kind text;
  v_workspace_name text;
  v_workspace_status text;
  v_workspace_version bigint;
  v_membership_actor_id text;
  v_membership_role text;
  v_membership_status text;
  v_membership_version bigint;
  v_plan_key text;
  v_entitlement_status text;
  v_entitlement_version bigint;
  v_features jsonb;
  v_input_limits jsonb;
  v_effective_limits jsonb;
  v_current_limits jsonb;
  v_workspace forms.workspaces%rowtype;
  v_membership forms.workspace_memberships%rowtype;
  v_entitlement forms.workspace_entitlements%rowtype;
  v_scope_hash bytea;
  v_request_hash bytea;
  v_existing jsonb;
  v_response jsonb;
  v_applied boolean := false;
  v_entitlement_applied boolean := false;
  v_entitlement_exists boolean := false;
begin
  if jsonb_typeof(p_workspace) <> 'object'
     or jsonb_typeof(p_membership) <> 'object'
     or jsonb_typeof(p_entitlement) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_WORKSPACE_PROJECTION';
  end if;

  v_source_workspace_id := p_workspace ->> 'sourceWorkspaceId';
  v_workspace_kind := p_workspace ->> 'kind';
  v_workspace_name := p_workspace ->> 'displayName';
  v_workspace_status := p_workspace ->> 'status';
  v_workspace_version := (p_workspace ->> 'sourceVersion')::bigint;
  v_membership_actor_id := p_membership ->> 'actorId';
  v_membership_role := p_membership ->> 'role';
  v_membership_status := p_membership ->> 'status';
  v_membership_version := (p_membership ->> 'sourceVersion')::bigint;
  v_plan_key := p_entitlement ->> 'planKey';
  v_entitlement_status := p_entitlement ->> 'status';
  v_entitlement_version := (p_entitlement ->> 'sourceVersion')::bigint;
  v_features := coalesce(p_entitlement -> 'features', '{}'::jsonb);
  v_input_limits := coalesce(p_entitlement -> 'limits', '{}'::jsonb);

  if length(p_operation_id) not between 8 and 200
     or length(p_request_hash) not between 1 and 1048576
     or length(v_source_workspace_id) not between 1 and 160
     or v_workspace_kind not in ('personal', 'team')
     or length(btrim(v_workspace_name)) not between 1 and 160
     or v_workspace_status not in ('active', 'suspended', 'deleting', 'deleted')
     or v_workspace_version < 0
     or length(v_membership_actor_id) not between 1 and 128
     or v_membership_actor_id is distinct from p_actor_id
     or v_membership_role not in ('owner', 'admin', 'editor', 'viewer')
     or v_membership_status not in ('active', 'removed')
     or v_membership_version < 0
     or v_plan_key !~ '^[a-z][a-z0-9_-]{0,63}$'
     or v_entitlement_status not in ('active', 'grace', 'suspended', 'cancelled')
     or v_entitlement_version < 0
     or jsonb_typeof(v_features) <> 'object'
     or jsonb_typeof(v_input_limits) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_WORKSPACE_PROJECTION';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(v_input_limits) as supplied(metric_key)
    left join forms.usage_metrics as metric using (metric_key)
    where metric.metric_key is null
  ) then
    raise exception using errcode = '22023', message = 'UNKNOWN_USAGE_METRIC';
  end if;

  v_effective_limits := jsonb_build_object(
    'forms.total', 3,
    'forms.published', 1,
    'submissions.accepted', 50,
    'storage.bytes', 0,
    'team.seats', 1
  ) || v_input_limits;

  if exists (
    select 1
    from jsonb_each(v_effective_limits) as limits(metric_key, limit_value)
    where jsonb_typeof(limits.limit_value) not in ('number', 'null')
       or (jsonb_typeof(limits.limit_value) = 'number' and limits.limit_value #>> '{}' !~ '^[0-9]+$')
  ) then
    raise exception using errcode = '22023', message = 'INVALID_ENTITLEMENT_LIMIT';
  end if;

  v_scope_hash := public.digest(
    pg_catalog.convert_to('projection' || chr(31) || v_source_workspace_id, 'UTF8'),
    'sha256'
  );
  v_request_hash := public.digest(pg_catalog.convert_to(p_request_hash, 'UTF8'), 'sha256');
  v_existing := forms_private.begin_idempotency(
    v_scope_hash, 'workspace.projection', p_operation_id, v_request_hash
  );
  if v_existing is not null then return v_existing; end if;

  select * into v_workspace
  from forms.workspaces
  where source = 'jobing' and source_workspace_id = v_source_workspace_id
  for update;

  if not found then
    insert into forms.workspaces (
      source, source_workspace_id, kind, display_name, status, source_version, deleted_at
    ) values (
      'jobing', v_source_workspace_id, v_workspace_kind, btrim(v_workspace_name),
      v_workspace_status, v_workspace_version,
      case when v_workspace_status in ('deleting', 'deleted') then clock_timestamp() else null end
    ) returning * into v_workspace;
    v_applied := true;
  elsif v_workspace_version = v_workspace.source_version then
    if v_workspace.kind is distinct from v_workspace_kind
       or v_workspace.display_name is distinct from btrim(v_workspace_name)
       or v_workspace.status is distinct from v_workspace_status then
      raise exception using errcode = 'P0001', message = 'PROJECTION_VERSION_CONFLICT';
    end if;
  elsif v_workspace_version > v_workspace.source_version then
    update forms.workspaces
    set kind = v_workspace_kind,
        display_name = btrim(v_workspace_name),
        status = v_workspace_status,
        source_version = v_workspace_version,
        updated_at = clock_timestamp(),
        deleted_at = case when v_workspace_status in ('deleting', 'deleted') then clock_timestamp() else null end
    where id = v_workspace.id
    returning * into v_workspace;
    v_applied := true;
  end if;

  select * into v_membership
  from forms.workspace_memberships
  where workspace_id = v_workspace.id and actor_id = v_membership_actor_id
  for update;

  if not found then
    insert into forms.workspace_memberships (
      workspace_id, actor_id, role, status, source_version, removed_at
    ) values (
      v_workspace.id, v_membership_actor_id, v_membership_role, v_membership_status,
      v_membership_version,
      case when v_membership_status = 'removed' then clock_timestamp() else null end
    ) returning * into v_membership;
    v_applied := true;
  elsif v_membership_version = v_membership.source_version then
    if v_membership.role is distinct from v_membership_role
       or v_membership.status is distinct from v_membership_status then
      raise exception using errcode = 'P0001', message = 'PROJECTION_VERSION_CONFLICT';
    end if;
  elsif v_membership_version > v_membership.source_version then
    update forms.workspace_memberships
    set role = v_membership_role,
        status = v_membership_status,
        source_version = v_membership_version,
        updated_at = clock_timestamp(),
        removed_at = case when v_membership_status = 'removed' then clock_timestamp() else null end
    where workspace_id = v_workspace.id and actor_id = v_membership_actor_id
    returning * into v_membership;
    v_applied := true;
  end if;

  select * into v_entitlement
  from forms.workspace_entitlements
  where workspace_id = v_workspace.id
  for update;

  v_entitlement_exists := found;
  if v_entitlement_exists then
    select coalesce(jsonb_object_agg(limits.metric_key, to_jsonb(limits.hard_limit)), '{}'::jsonb)
    into v_current_limits
    from forms.entitlement_limits as limits
    where limits.workspace_id = v_workspace.id;
  end if;

  if not v_entitlement_exists then
    insert into forms.workspace_entitlements (
      workspace_id, plan_key, status, source_version, features
    ) values (
      v_workspace.id, v_plan_key, v_entitlement_status, v_entitlement_version, v_features
    ) returning * into v_entitlement;
    v_entitlement_applied := true;
    v_applied := true;
  elsif v_entitlement_version = v_entitlement.source_version then
    if v_entitlement.plan_key is distinct from v_plan_key
       or v_entitlement.status is distinct from v_entitlement_status
       or v_entitlement.features is distinct from v_features
       or coalesce(v_current_limits, '{}'::jsonb) is distinct from v_effective_limits then
      raise exception using errcode = 'P0001', message = 'PROJECTION_VERSION_CONFLICT';
    end if;
  elsif v_entitlement_version > v_entitlement.source_version then
    update forms.workspace_entitlements
    set plan_key = v_plan_key,
        status = v_entitlement_status,
        source_version = v_entitlement_version,
        features = v_features,
        effective_from = clock_timestamp(),
        updated_at = clock_timestamp()
    where workspace_id = v_workspace.id
    returning * into v_entitlement;
    v_entitlement_applied := true;
    v_applied := true;
  end if;

  if v_entitlement_applied then
    delete from forms.entitlement_limits where workspace_id = v_workspace.id;
    insert into forms.entitlement_limits (workspace_id, metric_key, hard_limit)
    select
      v_workspace.id,
      limits.metric_key,
      case
        when jsonb_typeof(limits.limit_value) = 'null' then null
        else (limits.limit_value #>> '{}')::bigint
      end
    from jsonb_each(v_effective_limits) as limits(metric_key, limit_value);
  end if;

  insert into forms.projects (
    workspace_id, name, slug, created_by_actor_id
  ) values (
    v_workspace.id, 'Default', 'default', v_membership_actor_id
  ) on conflict do nothing;

  insert into forms.usage_counters (workspace_id, metric_key, bucket_key)
  values
    (v_workspace.id, 'forms.total', 'current'),
    (v_workspace.id, 'forms.published', 'current'),
    (v_workspace.id, 'storage.bytes', 'current'),
    (v_workspace.id, 'team.seats', 'current')
  on conflict do nothing;

  if v_applied then
    insert into forms_audit.events (
      workspace_id, actor_type, actor_id, action, target_type, target_id, request_id, metadata
    ) values (
      v_workspace.id, 'system', v_membership_actor_id, 'workspace.projection_applied',
      'workspace', v_workspace.id::text, p_operation_id,
      jsonb_build_object(
        'workspaceVersion', v_workspace_version,
        'membershipVersion', v_membership_version,
        'entitlementVersion', v_entitlement_version
      )
    );

    insert into forms_private.outbox_events (
      workspace_id, topic, aggregate_type, aggregate_id, dedupe_key, payload
    ) values (
      v_workspace.id, 'forms.workspace.projected', 'workspace', v_workspace.id::text,
      'workspace:projection:' || p_operation_id,
      jsonb_build_object('workspaceId', v_workspace.id, 'sourceVersion', v_workspace_version)
    );
  end if;

  v_response := jsonb_build_object('workspaceId', v_workspace.id, 'applied', v_applied);
  perform forms_private.complete_idempotency(
    v_scope_hash, 'workspace.projection', p_operation_id, v_response, 'workspace', v_workspace.id
  );
  return v_response;
end
$function$;

create function forms_api.list_forms(p_actor_id text)
returns setof jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  if length(p_actor_id) not between 1 and 128 then
    return;
  end if;

  return query
  select jsonb_build_object(
    'id', form_row.id,
    'name', form_row.name,
    'status', form_row.status,
    'revision', draft.revision,
    'publishedVersion', form_row.version_sequence,
    'endpointId', endpoint.public_id,
    'updatedAt', form_row.updated_at
  )
  from forms.workspace_memberships as membership
  join forms.workspaces as workspace
    on workspace.id = membership.workspace_id
  join forms.forms as form_row
    on form_row.workspace_id = workspace.id
  join forms.form_drafts as draft
    on draft.workspace_id = form_row.workspace_id and draft.form_id = form_row.id
  join forms.form_endpoints as endpoint
    on endpoint.workspace_id = form_row.workspace_id
   and endpoint.form_id = form_row.id
   and endpoint.status = 'active'
  where membership.actor_id = p_actor_id
    and membership.status = 'active'
    and workspace.status <> 'deleted'
  order by form_row.updated_at desc, form_row.id;
end
$function$;

create function forms_api.create_form_draft(
  p_actor_id text,
  p_client_id text,
  p_grant_id uuid,
  p_operation_id text,
  p_request_hash text,
  p_name text,
  p_description text,
  p_definition jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_workspace_id uuid;
  v_project_id uuid;
  v_member_role text;
  v_form_id uuid := public.gen_random_uuid();
  v_endpoint_id text := 'frm_' || pg_catalog.encode(public.gen_random_bytes(24), 'hex');
  v_scope_hash bytea;
  v_request_hash bytea;
  v_existing jsonb;
  v_response jsonb;
begin
  if length(p_actor_id) not between 1 and 128
     or length(p_client_id) not between 1 and 128
     or p_grant_id is null
     or length(p_operation_id) not between 8 and 200
     or length(p_request_hash) not between 1 and 1048576
     or length(btrim(p_name)) not between 1 and 200
     or p_description is not null and length(p_description) > 2000 then
    raise exception using errcode = '22023', message = 'INVALID_FORM_DRAFT';
  end if;
  if jsonb_typeof(p_definition) <> 'object'
     or p_definition ->> 'schemaVersion' is distinct from '1'
     or jsonb_typeof(p_definition -> 'title') <> 'string'
     or jsonb_typeof(p_definition -> 'fields') <> 'array'
     or pg_column_size(p_definition) > 524288 then
    raise exception using errcode = '22023', message = 'INVALID_FORM_DEFINITION';
  end if;
  if jsonb_array_length(p_definition -> 'fields') not between 1 and 100 then
    raise exception using errcode = '22023', message = 'INVALID_FORM_DEFINITION';
  end if;

  select workspace.id, membership.role, project.id
  into v_workspace_id, v_member_role, v_project_id
  from forms.workspace_memberships as membership
  join forms.workspaces as workspace
    on workspace.id = membership.workspace_id
  join forms.workspace_entitlements as entitlement
    on entitlement.workspace_id = workspace.id
  join lateral (
    select projects.id
    from forms.projects
    where projects.workspace_id = workspace.id and projects.status = 'active'
    order by (projects.slug = 'default') desc, projects.created_at, projects.id
    limit 1
  ) as project on true
  where membership.actor_id = p_actor_id
    and membership.status = 'active'
    and workspace.status = 'active'
    and entitlement.status in ('active', 'grace')
  order by (membership.role = 'owner') desc, (workspace.kind = 'personal') desc, workspace.created_at
  limit 1;

  if v_workspace_id is null or v_member_role not in ('owner', 'admin', 'editor') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  v_scope_hash := public.digest(
    pg_catalog.convert_to(p_actor_id || chr(31) || p_client_id || chr(31) || p_grant_id::text, 'UTF8'),
    'sha256'
  );
  v_request_hash := public.digest(pg_catalog.convert_to(p_request_hash, 'UTF8'), 'sha256');
  v_existing := forms_private.begin_idempotency(
    v_scope_hash, 'form.create', p_operation_id, v_request_hash
  );
  if v_existing is not null then return v_existing; end if;

  perform forms_private.apply_gauge_delta(
    v_workspace_id,
    'forms.total',
    1,
    3,
    'form:create:' || v_form_id::text,
    'form',
    v_form_id::text,
    'form_created',
    'mcp',
    p_actor_id
  );

  insert into forms.forms (
    id, workspace_id, project_id, name, description,
    created_by_actor_id, updated_by_actor_id
  ) values (
    v_form_id, v_workspace_id, v_project_id, btrim(p_name), nullif(btrim(p_description), ''),
    p_actor_id, p_actor_id
  );

  insert into forms.form_drafts (
    workspace_id, form_id, revision, schema_version, definition, updated_by_actor_id
  ) values (
    v_workspace_id, v_form_id, 1, 1, p_definition, p_actor_id
  );

  insert into forms.form_endpoints (
    workspace_id, form_id, public_id, created_by_actor_id
  ) values (
    v_workspace_id, v_form_id, v_endpoint_id, p_actor_id
  );

  insert into forms_audit.events (
    workspace_id, actor_type, actor_id, action, target_type, target_id, request_id, metadata
  ) values (
    v_workspace_id, 'mcp', p_actor_id, 'form.created', 'form', v_form_id::text, p_operation_id,
    jsonb_build_object(
      'projectId', v_project_id,
      'clientId', p_client_id,
      'grantId', p_grant_id
    )
  );

  insert into forms_private.outbox_events (
    workspace_id, topic, aggregate_type, aggregate_id, dedupe_key, payload
  ) values (
    v_workspace_id, 'forms.form.created', 'form', v_form_id::text,
    'form:create:' || v_form_id::text,
    jsonb_build_object('workspaceId', v_workspace_id, 'formId', v_form_id)
  );

  v_response := jsonb_build_object(
    'id', v_form_id,
    'name', btrim(p_name),
    'status', 'draft',
    'revision', 1,
    'endpointId', v_endpoint_id
  );
  perform forms_private.complete_idempotency(
    v_scope_hash, 'form.create', p_operation_id, v_response, 'form', v_form_id
  );
  return v_response;
end
$function$;

reset role;
