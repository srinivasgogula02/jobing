set role jobing_forms_owner;

-- Keep the original migration immutable while moving all future free workspace
-- projections to the five-form product limit.
create or replace function forms_api.apply_workspace_projection(
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
    'forms.total', 5,
    'forms.published', 5,
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

reset role;
