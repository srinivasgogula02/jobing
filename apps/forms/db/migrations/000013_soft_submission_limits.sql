set role jobing_forms_owner;

-- Submission allowances control what owners can read, not whether a customer can
-- send a valid response. Meter every accepted response without throwing when the
-- workspace passes its allowance. Forms and publishing continue to use hard caps.
create function forms_private.record_meter_delta(
  p_workspace_id uuid,
  p_metric_key text,
  p_delta bigint,
  p_default_limit bigint,
  p_dedupe_key text,
  p_source_type text,
  p_source_id text,
  p_reason text,
  p_actor_type text,
  p_actor_id text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_limit bigint;
  v_limit_found boolean;
  v_bucket_key text := to_char(clock_timestamp(), 'YYYY-MM');
  v_inserted boolean;
begin
  if p_delta <= 0 then return; end if;

  select limits.hard_limit, true into v_limit, v_limit_found
  from forms.entitlement_limits as limits
  where limits.workspace_id = p_workspace_id and limits.metric_key = p_metric_key;
  if not coalesce(v_limit_found, false) then v_limit := p_default_limit; end if;

  insert into forms.usage_counters(workspace_id,metric_key,bucket_key,used,reserved,limit_snapshot)
  values(p_workspace_id,p_metric_key,v_bucket_key,0,0,v_limit)
  on conflict(workspace_id,metric_key,bucket_key) do nothing;

  insert into forms.usage_ledger(
    workspace_id,metric_key,bucket_key,delta,dedupe_key,source_type,source_id,reason,actor_type,actor_id
  ) values (
    p_workspace_id,p_metric_key,v_bucket_key,p_delta,p_dedupe_key,p_source_type,p_source_id,p_reason,p_actor_type,p_actor_id
  )
  on conflict(workspace_id,metric_key,dedupe_key) do nothing
  returning true into v_inserted;

  if coalesce(v_inserted,false) then
    update forms.usage_counters
    set used=used+p_delta,limit_snapshot=v_limit,version=version+1,updated_at=clock_timestamp()
    where workspace_id=p_workspace_id and metric_key=p_metric_key and bucket_key=v_bucket_key;
  end if;
end
$function$;

create function forms_private.submission_is_visible(p_workspace_id uuid,p_submission_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  v_limit bigint;
  v_limit_found boolean;
  v_received_at timestamptz;
  v_rank bigint;
begin
  select limits.hard_limit, true into v_limit, v_limit_found
  from forms.entitlement_limits as limits
  where limits.workspace_id=p_workspace_id and limits.metric_key='submissions.accepted';
  if not coalesce(v_limit_found,false) then v_limit:=50; end if;
  if v_limit is null then return true; end if;

  select submissions.received_at into v_received_at
  from forms.submissions as submissions
  where submissions.workspace_id=p_workspace_id and submissions.id=p_submission_id;
  if not found then return false; end if;

  select count(*) into v_rank
  from forms.submissions as submissions
  where submissions.workspace_id=p_workspace_id
    and date_trunc('month',submissions.received_at)=date_trunc('month',v_received_at)
    and (submissions.received_at,submissions.id) <= (v_received_at,p_submission_id);
  return v_rank <= v_limit;
end
$function$;

create or replace function forms_api.accept_submission(
  p_public_id text,p_idempotency_key text,p_values jsonb,p_origin text,p_ip_hash_hex text
) returns jsonb language plpgsql security definer set search_path = pg_catalog
as $function$
declare
  v_endpoint forms.form_endpoints%rowtype;
  v_form forms.forms%rowtype;
  v_definition jsonb;
  v_ip_hash bytea;
  v_submission_id uuid;
  v_count integer;
  v_allowed jsonb;
begin
  if length(p_idempotency_key) not between 8 and 200 or jsonb_typeof(p_values)<>'object'
    or pg_column_size(p_values)>262144 or p_ip_hash_hex !~ '^[0-9a-f]{64}$' then
    raise exception using errcode='22023',message='INVALID_SUBMISSION';
  end if;
  v_ip_hash:=decode(p_ip_hash_hex,'hex');
  select endpoint.* into v_endpoint from forms.form_endpoints endpoint where endpoint.public_id=p_public_id for update;
  if not found or v_endpoint.status not in ('active','retiring')
    or (v_endpoint.accept_until is not null and v_endpoint.accept_until<clock_timestamp()) then
    raise exception using errcode='P0001',message='FORM_NOT_FOUND';
  end if;
  select form_row.* into v_form from forms.forms form_row
  where form_row.workspace_id=v_endpoint.workspace_id and form_row.id=v_endpoint.form_id for update;
  if v_form.status<>'published' then raise exception using errcode='P0001',message='FORM_NOT_ACCEPTING'; end if;
  select version.definition into v_definition from forms.form_versions version where version.id=v_form.published_version_id;
  v_allowed:=coalesce(v_definition #> '{settings,allowedOrigins}','[]'::jsonb);
  if p_origin is not null and jsonb_array_length(v_allowed)>0 and not (v_allowed ? p_origin) then
    raise exception using errcode='P0001',message='ORIGIN_NOT_ALLOWED';
  end if;

  -- A browser retry with the same idempotency key is a replay, not another
  -- submission and not another rate-limit hit.
  select submission.id into v_submission_id from forms.submissions submission
  where submission.workspace_id=v_form.workspace_id and submission.form_id=v_form.id
    and submission.idempotency_key=p_idempotency_key;
  if v_submission_id is not null then
    return jsonb_build_object('submissionId',v_submission_id,
      'message',coalesce(v_definition #>> '{confirmation,message}','Thanks, your response was received.'),
      'redirectUrl',v_definition #>> '{confirmation,redirectUrl}');
  end if;

  insert into forms_private.submission_rate_limits(endpoint_id,ip_hash,window_started_at)
  values(v_endpoint.id,v_ip_hash,date_trunc('minute',clock_timestamp()))
  on conflict(endpoint_id,ip_hash,window_started_at) do update
    set request_count=forms_private.submission_rate_limits.request_count+1
  returning request_count into v_count;
  if v_count>30 then raise exception using errcode='P0001',message='RATE_LIMITED'; end if;

  insert into forms.submissions(workspace_id,form_id,form_version_id,endpoint_id,idempotency_key,values,origin,ip_hash)
  values(v_form.workspace_id,v_form.id,v_form.published_version_id,v_endpoint.id,p_idempotency_key,p_values,p_origin,v_ip_hash)
  on conflict(workspace_id,form_id,idempotency_key) do nothing returning id into v_submission_id;
  if v_submission_id is null then
    select submission.id into v_submission_id from forms.submissions submission
    where submission.workspace_id=v_form.workspace_id and submission.form_id=v_form.id
      and submission.idempotency_key=p_idempotency_key;
  else
    perform forms_private.record_meter_delta(
      v_form.workspace_id,'submissions.accepted',1,50,'submission:'||v_submission_id,
      'submission',v_submission_id::text,'submission_accepted','system',null
    );
  end if;
  return jsonb_build_object('submissionId',v_submission_id,
    'message',coalesce(v_definition #>> '{confirmation,message}','Thanks, your response was received.'),
    'redirectUrl',v_definition #>> '{confirmation,redirectUrl}');
end
$function$;

create or replace function forms_api.accept_submission_v2(
  p_public_id text,p_idempotency_key text,p_values jsonb,p_origin text,p_ip_hash_hex text,p_files jsonb
) returns jsonb language plpgsql security definer set search_path = pg_catalog
as $function$
declare
  v_result jsonb; v_submission_id uuid; v_workspace_id uuid; v_form_id uuid;
  v_file jsonb; v_content bytea; v_count integer:=0; v_inserted integer;
begin
  if p_files is null then p_files:='[]'::jsonb; end if;
  if jsonb_typeof(p_files)<>'array' or jsonb_array_length(p_files)>10 then
    raise exception using errcode='22023',message='INVALID_FILES';
  end if;
  v_result:=forms_api.accept_submission(p_public_id,p_idempotency_key,p_values,p_origin,p_ip_hash_hex);
  v_submission_id:=(v_result->>'submissionId')::uuid;
  select submission.workspace_id,submission.form_id into v_workspace_id,v_form_id
  from forms.submissions submission where submission.id=v_submission_id;
  for v_file in select value from jsonb_array_elements(p_files) loop
    if coalesce(v_file->>'fieldKey','') !~ '^[a-z][a-z0-9_]*$'
      or length(coalesce(v_file->>'fileName','')) not between 1 and 240
      or length(coalesce(v_file->>'contentType','')) not between 1 and 160
      or length(coalesce(v_file->>'contentBase64',''))>2700000 then
      raise exception using errcode='22023',message='INVALID_FILE';
    end if;
    begin v_content:=decode(v_file->>'contentBase64','base64');
    exception when others then raise exception using errcode='22023',message='INVALID_FILE'; end;
    if octet_length(v_content) not between 1 and 2000000 then
      raise exception using errcode='22023',message='INVALID_FILE';
    end if;
    insert into forms.submission_files(workspace_id,form_id,submission_id,field_key,file_name,content_type,byte_size,content)
    values(v_workspace_id,v_form_id,v_submission_id,v_file->>'fieldKey',v_file->>'fileName',v_file->>'contentType',octet_length(v_content),v_content)
    on conflict(submission_id,field_key) do nothing;
    get diagnostics v_inserted=row_count;
    v_count:=v_count+v_inserted;
  end loop;
  return v_result||jsonb_build_object('fileCount',v_count);
end
$function$;

create or replace function forms_api.list_submissions(p_actor_id text,p_form_id uuid,p_limit integer default 50)
returns setof jsonb language sql stable security definer set search_path = pg_catalog
as $function$
  select jsonb_build_object('id',submission.id,'formId',submission.form_id,'receivedAt',submission.received_at,'values',submission.values)
  from forms.submissions submission
  join forms.workspace_memberships membership on membership.workspace_id=submission.workspace_id
  where membership.actor_id=p_actor_id and membership.status='active' and submission.form_id=p_form_id
    and forms_private.submission_is_visible(submission.workspace_id,submission.id)
  order by submission.received_at desc,submission.id desc limit least(greatest(p_limit,1),100)
$function$;

create or replace function forms_api.get_submission(p_actor_id text,p_submission_id uuid)
returns jsonb language sql stable security definer set search_path = pg_catalog
as $function$
  select jsonb_build_object('id',submission.id,'formId',submission.form_id,'formVersionId',submission.form_version_id,
    'receivedAt',submission.received_at,'values',submission.values)
  from forms.submissions submission
  join forms.workspace_memberships membership on membership.workspace_id=submission.workspace_id
  where membership.actor_id=p_actor_id and membership.status='active' and submission.id=p_submission_id
    and forms_private.submission_is_visible(submission.workspace_id,submission.id)
$function$;

create or replace function forms_api.list_submissions_v2(
  p_actor_id text,p_form_id uuid,p_query text default '',p_state text default 'inbox',
  p_sort text default 'newest',p_page integer default 1,p_page_size integer default 20
) returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare
  v_workspace_id uuid; v_plan_key text; v_limit bigint; v_limit_found boolean;
  v_total bigint; v_stored_total bigint; v_visible_total bigint; v_items jsonb;
begin
  select form_row.workspace_id,entitlement.plan_key,limits.hard_limit,(limits.workspace_id is not null)
  into v_workspace_id,v_plan_key,v_limit,v_limit_found
  from forms.forms form_row
  join forms.workspace_memberships membership on membership.workspace_id=form_row.workspace_id
  join forms.workspace_entitlements entitlement on entitlement.workspace_id=form_row.workspace_id
  left join forms.entitlement_limits limits on limits.workspace_id=form_row.workspace_id
    and limits.metric_key='submissions.accepted'
  where form_row.id=p_form_id and membership.actor_id=p_actor_id and membership.status='active' limit 1;
  if v_workspace_id is null then raise exception using errcode='P0001',message='FORBIDDEN'; end if;
  if not coalesce(v_limit_found,false) then v_limit:=50; end if;
  if p_state not in ('inbox','spam','archived') or p_sort not in ('newest','oldest')
    or length(coalesce(p_query,''))>200 then raise exception using errcode='22023',message='INVALID_FILTER'; end if;
  p_page:=greatest(coalesce(p_page,1),1);
  p_page_size:=least(greatest(coalesce(p_page_size,20),1),100);

  select count(*) into v_stored_total from forms.submissions submission
  where submission.workspace_id=v_workspace_id and submission.form_id=p_form_id;

  with ranked as (
    select submission.*,
      row_number() over(partition by date_trunc('month',submission.received_at)
        order by submission.received_at,submission.id) as allowance_rank
    from forms.submissions submission where submission.workspace_id=v_workspace_id
  ), visible as (
    select * from ranked where v_limit is null or allowance_rank<=v_limit
  )
  select count(*) filter(where form_id=p_form_id),
    count(*) filter(where form_id=p_form_id and review_state=p_state
      and (coalesce(btrim(p_query),'')='' or values::text ilike '%'||btrim(p_query)||'%'))
  into v_visible_total,v_total from visible;

  with ranked as (
    select submission.*,
      row_number() over(partition by date_trunc('month',submission.received_at)
        order by submission.received_at,submission.id) as allowance_rank
    from forms.submissions submission where submission.workspace_id=v_workspace_id
  ), visible as (
    select * from ranked where v_limit is null or allowance_rank<=v_limit
  )
  select coalesce(jsonb_agg(item),'[]'::jsonb) into v_items from (
    select jsonb_build_object('id',submission.id,'formId',submission.form_id,'receivedAt',submission.received_at,
      'values',submission.values,'reviewState',submission.review_state,
      'fileCount',(select count(*) from forms.submission_files file_row where file_row.submission_id=submission.id),
      'files',coalesce((select jsonb_agg(jsonb_build_object('id',file_row.id,'submissionId',file_row.submission_id,
        'fieldKey',file_row.field_key,'fileName',file_row.file_name,'contentType',file_row.content_type,
        'byteSize',file_row.byte_size,'scanStatus',file_row.scan_status) order by file_row.created_at,file_row.id)
        from forms.submission_files file_row where file_row.submission_id=submission.id),'[]'::jsonb)) item,
      submission.received_at,submission.id
    from visible submission
    where submission.form_id=p_form_id and submission.review_state=p_state
      and (coalesce(btrim(p_query),'')='' or submission.values::text ilike '%'||btrim(p_query)||'%')
    order by case when p_sort='oldest' then submission.received_at end asc,
      case when p_sort='newest' then submission.received_at end desc,
      case when p_sort='oldest' then submission.id end asc,
      case when p_sort='newest' then submission.id end desc
    limit p_page_size offset (p_page-1)*p_page_size
  ) rows;

  return jsonb_build_object('items',v_items,'total',v_total,'page',p_page,'pageSize',p_page_size,
    'pages',greatest(1,ceil(v_total::numeric/p_page_size)::integer),'storedTotal',v_stored_total,
    'visibleTotal',v_visible_total,'hiddenTotal',greatest(v_stored_total-v_visible_total,0),
    'visibilityLimit',v_limit,'visibilityPeriod','month','planKey',v_plan_key);
end
$function$;

create or replace function forms_api.set_submission_review_state(p_actor_id text,p_submission_id uuid,p_state text)
returns boolean language plpgsql security definer set search_path = pg_catalog
as $function$
begin
  if p_state not in ('inbox','spam','archived') then
    raise exception using errcode='22023',message='INVALID_REVIEW_STATE';
  end if;
  update forms.submissions submission
  set review_state=p_state,reviewed_at=clock_timestamp(),reviewed_by_actor_id=p_actor_id
  where submission.id=p_submission_id
    and forms_private.submission_is_visible(submission.workspace_id,submission.id)
    and exists(select 1 from forms.workspace_memberships membership
      where membership.workspace_id=submission.workspace_id and membership.actor_id=p_actor_id
        and membership.status='active' and membership.role in ('owner','admin','editor'));
  return found;
end
$function$;

create or replace function forms_api.list_submission_files(p_actor_id text,p_submission_id uuid)
returns setof jsonb language sql stable security definer set search_path = pg_catalog
as $function$
  select jsonb_build_object('id',file_row.id,'submissionId',file_row.submission_id,'fieldKey',file_row.field_key,
    'fileName',file_row.file_name,'contentType',file_row.content_type,'byteSize',file_row.byte_size,'scanStatus',file_row.scan_status)
  from forms.submission_files file_row
  join forms.submissions submission on submission.id=file_row.submission_id
  join forms.workspace_memberships membership on membership.workspace_id=file_row.workspace_id
  where file_row.submission_id=p_submission_id and membership.actor_id=p_actor_id and membership.status='active'
    and forms_private.submission_is_visible(submission.workspace_id,submission.id)
  order by file_row.created_at,file_row.id
$function$;

create or replace function forms_api.get_submission_file(p_actor_id text,p_file_id uuid)
returns jsonb language sql stable security definer set search_path = pg_catalog
as $function$
  select jsonb_build_object('fileName',file_row.file_name,'contentType',file_row.content_type,'byteSize',file_row.byte_size,
    'scanStatus',file_row.scan_status,'contentBase64',encode(file_row.content,'base64'))
  from forms.submission_files file_row
  join forms.submissions submission on submission.id=file_row.submission_id
  join forms.workspace_memberships membership on membership.workspace_id=file_row.workspace_id
  where file_row.id=p_file_id and membership.actor_id=p_actor_id and membership.status='active'
    and forms_private.submission_is_visible(submission.workspace_id,submission.id)
$function$;

revoke execute on function forms_private.record_meter_delta(uuid,text,bigint,bigint,text,text,text,text,text,text),
  forms_private.submission_is_visible(uuid,uuid)
  from public,jobing_forms_control,jobing_forms_sync,jobing_forms_public,jobing_forms_ingest,jobing_forms_worker,jobing_forms_auditor;

reset role;
