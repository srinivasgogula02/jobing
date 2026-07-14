set role jobing_forms_owner;

create or replace function forms_api.list_forms(p_actor_id text)
returns setof jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  if length(p_actor_id) not between 1 and 128 then return; end if;
  return query
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
  where membership.actor_id = p_actor_id and membership.status = 'active' and workspace.status <> 'deleted'
  order by form_row.updated_at desc, form_row.id;
end
$function$;

revoke execute on function forms_api.list_forms(text) from public, jobing_forms_sync, jobing_forms_public, jobing_forms_ingest, jobing_forms_worker, jobing_forms_auditor;
grant execute on function forms_api.list_forms(text) to jobing_forms_control;

reset role;
