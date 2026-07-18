set role jobing_forms_owner;

-- Return the accepted-response count with the published definition so the hosted
-- form can show a friendly closed state before a visitor spends time filling it.
create or replace function forms_api.get_public_form(p_public_id text)
returns jsonb language sql stable security definer set search_path = pg_catalog
as $function$
  select jsonb_build_object(
    'formId', form_row.id, 'endpointId', endpoint.public_id, 'versionId', version_row.id,
    'version', version_row.version_number, 'name', form_row.name, 'definition', version_row.definition,
    'submissionCount', (select count(*) from forms.submissions submission
      where submission.workspace_id=form_row.workspace_id and submission.form_id=form_row.id)
  )
  from forms.form_endpoints endpoint
  join forms.forms form_row on form_row.workspace_id=endpoint.workspace_id and form_row.id=endpoint.form_id
  join forms.form_versions version_row on version_row.workspace_id=form_row.workspace_id and version_row.form_id=form_row.id and version_row.id=form_row.published_version_id
  where endpoint.public_id=p_public_id and endpoint.status in ('active','retiring')
    and (endpoint.accept_until is null or endpoint.accept_until>=clock_timestamp()) and form_row.status='published'
$function$;

-- Owner-defined response controls are hard product rules, unlike plan viewing
-- allowances. Locking the form row makes a responseLimit exact under concurrency.
create function forms_api.accept_submission_v3(
  p_public_id text,p_idempotency_key text,p_values jsonb,p_origin text,p_ip_hash_hex text,p_files jsonb
) returns jsonb language plpgsql security definer set search_path = pg_catalog
as $function$
declare
  v_form forms.forms%rowtype;
  v_definition jsonb;
  v_count bigint;
  v_opens_at timestamptz;
  v_closes_at timestamptz;
  v_response_limit bigint;
begin
  select form_row.* into v_form
  from forms.form_endpoints endpoint
  join forms.forms form_row on form_row.workspace_id=endpoint.workspace_id and form_row.id=endpoint.form_id
  where endpoint.public_id=p_public_id and endpoint.status in ('active','retiring')
  for update of form_row;
  if not found or v_form.status<>'published' then
    raise exception using errcode='P0001',message='FORM_NOT_FOUND';
  end if;
  select version_row.definition into v_definition from forms.form_versions version_row where version_row.id=v_form.published_version_id;
  -- A retry of an already accepted request must keep returning its original
  -- success even if the form was paused or reached its exact cap afterwards.
  if exists(select 1 from forms.submissions submission where submission.workspace_id=v_form.workspace_id
    and submission.form_id=v_form.id and submission.idempotency_key=p_idempotency_key) then
    return forms_api.accept_submission_v2(p_public_id,p_idempotency_key,p_values,p_origin,p_ip_hash_hex,p_files);
  end if;
  if coalesce((v_definition #>> '{settings,acceptResponses}')::boolean,true)=false then
    raise exception using errcode='P0001',message='FORM_CLOSED';
  end if;
  begin v_opens_at:=(v_definition #>> '{settings,opensAt}')::timestamptz; exception when others then v_opens_at:=null; end;
  begin v_closes_at:=(v_definition #>> '{settings,closesAt}')::timestamptz; exception when others then v_closes_at:=null; end;
  begin v_response_limit:=(v_definition #>> '{settings,responseLimit}')::bigint; exception when others then v_response_limit:=null; end;
  if v_opens_at is not null and clock_timestamp()<v_opens_at then raise exception using errcode='P0001',message='FORM_CLOSED'; end if;
  if v_closes_at is not null and clock_timestamp()>=v_closes_at then raise exception using errcode='P0001',message='FORM_CLOSED'; end if;
  if v_response_limit is not null then
    select count(*) into v_count from forms.submissions submission
    where submission.workspace_id=v_form.workspace_id and submission.form_id=v_form.id;
    if v_count>=v_response_limit then raise exception using errcode='P0001',message='FORM_CLOSED'; end if;
  end if;
  return forms_api.accept_submission_v2(p_public_id,p_idempotency_key,p_values,p_origin,p_ip_hash_hex,p_files);
end
$function$;

revoke execute on function forms_api.accept_submission_v3(text,text,jsonb,text,text,jsonb)
  from public,jobing_forms_control,jobing_forms_sync,jobing_forms_public,jobing_forms_worker,jobing_forms_auditor;
grant execute on function forms_api.accept_submission_v3(text,text,jsonb,text,text,jsonb) to jobing_forms_ingest;

reset role;
