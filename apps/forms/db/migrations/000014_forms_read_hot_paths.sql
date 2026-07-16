set role jobing_forms_owner;

-- Detail screens should fetch one form, not serialize every definition in the
-- workspace and discard all but one in the web tier.
create function forms_api.get_form(p_actor_id text, p_form_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select jsonb_build_object(
    'id', form_row.id,
    'name', form_row.name,
    'status', form_row.status,
    'revision', draft.revision,
    'publishedVersion', form_row.version_sequence,
    'endpointId', endpoint.public_id,
    'definition', draft.definition,
    'updatedAt', form_row.updated_at
  )
  from forms.workspace_memberships membership
  join forms.workspaces workspace on workspace.id = membership.workspace_id
  join forms.forms form_row on form_row.workspace_id = workspace.id
  join forms.form_drafts draft on draft.workspace_id = form_row.workspace_id and draft.form_id = form_row.id
  join forms.form_endpoints endpoint on endpoint.workspace_id = form_row.workspace_id and endpoint.form_id = form_row.id and endpoint.status = 'active'
  where membership.actor_id = p_actor_id
    and membership.status = 'active'
    and workspace.status <> 'deleted'
    and form_row.id = p_form_id
  limit 1
$function$;

-- The forms index needs only card metadata. Definitions can be hundreds of KB
-- and are now loaded only when a user opens or edits one form.
create function forms_api.list_form_summaries(p_actor_id text)
returns setof jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select jsonb_build_object(
    'id', form_row.id,
    'name', form_row.name,
    'status', form_row.status,
    'revision', draft.revision,
    'publishedVersion', form_row.version_sequence,
    'endpointId', endpoint.public_id,
    'description', coalesce(draft.definition ->> 'description', ''),
    'fieldCount', coalesce(jsonb_array_length(draft.definition -> 'fields'), 0),
    'updatedAt', form_row.updated_at
  )
  from forms.workspace_memberships membership
  join forms.workspaces workspace on workspace.id = membership.workspace_id
  join forms.forms form_row on form_row.workspace_id = workspace.id
  join forms.form_drafts draft on draft.workspace_id = form_row.workspace_id and draft.form_id = form_row.id
  join forms.form_endpoints endpoint on endpoint.workspace_id = form_row.workspace_id and endpoint.form_id = form_row.id and endpoint.status = 'active'
  where membership.actor_id = p_actor_id
    and membership.status = 'active'
    and workspace.status <> 'deleted'
  order by form_row.updated_at desc, form_row.id
$function$;

revoke execute on function forms_api.get_form(text, uuid), forms_api.list_form_summaries(text)
  from public, jobing_forms_sync, jobing_forms_public, jobing_forms_ingest, jobing_forms_worker, jobing_forms_auditor;
grant execute on function forms_api.get_form(text, uuid), forms_api.list_form_summaries(text)
  to jobing_forms_control;

reset role;
