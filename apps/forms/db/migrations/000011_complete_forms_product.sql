set role jobing_forms_owner;

alter table forms.submissions
  add column review_state text not null default 'inbox'
    check (review_state in ('inbox', 'spam', 'archived')),
  add column reviewed_at timestamptz,
  add column reviewed_by_actor_id text
    check (reviewed_by_actor_id is null or length(reviewed_by_actor_id) between 1 and 128);

create index submissions_review_received_idx
  on forms.submissions(workspace_id, form_id, review_state, received_at desc, id desc);
create index submissions_values_gin_idx on forms.submissions using gin(values);

create table forms.submission_files (
  id uuid primary key default public.gen_random_uuid(),
  workspace_id uuid not null,
  form_id uuid not null,
  submission_id uuid not null,
  field_key text not null check (field_key ~ '^[a-z][a-z0-9_]*$'),
  file_name text not null check (length(file_name) between 1 and 240),
  content_type text not null check (length(content_type) between 1 and 160),
  byte_size integer not null check (byte_size between 1 and 2000000),
  content bytea not null,
  scan_status text not null default 'unscanned' check (scan_status in ('unscanned', 'clean', 'blocked')),
  created_at timestamptz not null default clock_timestamp(),
  unique (submission_id, field_key),
  foreign key (submission_id) references forms.submissions(id) on delete cascade,
  foreign key (workspace_id, form_id) references forms.forms(workspace_id, id) on delete restrict,
  check (octet_length(content) = byte_size)
);

create index submission_files_submission_idx on forms.submission_files(submission_id, id);

create table forms.blocked_submission_events (
  id uuid primary key default public.gen_random_uuid(),
  workspace_id uuid not null,
  form_id uuid not null,
  endpoint_id uuid not null,
  reason text not null check (reason in (
    'honeypot', 'challenge_failed', 'validation_failed', 'rate_limited',
    'origin_not_allowed', 'request_too_large', 'invalid_payload', 'unsupported_media_type'
  )),
  origin text check (origin is null or length(origin) <= 2048),
  ip_hash bytea not null check (octet_length(ip_hash) = 32),
  window_started_at timestamptz not null,
  event_count integer not null default 1 check (event_count > 0),
  last_occurred_at timestamptz not null default clock_timestamp(),
  unique (endpoint_id, ip_hash, reason, window_started_at),
  foreign key (workspace_id, form_id) references forms.forms(workspace_id, id) on delete restrict,
  foreign key (workspace_id, form_id, endpoint_id) references forms.form_endpoints(workspace_id, form_id, id) on delete restrict
);

create index blocked_submission_events_form_idx
  on forms.blocked_submission_events(workspace_id, form_id, last_occurred_at desc, id desc);

create function forms_private.dashboard_form_context(p_actor_id text, p_form_id uuid)
returns table(workspace_id uuid, member_role text, project_id uuid)
language sql stable security definer set search_path = pg_catalog
as $function$
  select form_row.workspace_id, membership.role, form_row.project_id
  from forms.forms form_row
  join forms.workspace_memberships membership
    on membership.workspace_id = form_row.workspace_id
   and membership.actor_id = p_actor_id
  join forms.workspaces workspace on workspace.id = form_row.workspace_id
  join forms.workspace_entitlements entitlement on entitlement.workspace_id = form_row.workspace_id
  where form_row.id = p_form_id
    and membership.status = 'active'
    and workspace.status = 'active'
    and entitlement.status in ('active', 'grace')
  limit 1
$function$;

create function forms_api.create_dashboard_form(p_actor_id text, p_name text, p_definition jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $function$
declare
  v_workspace_id uuid;
  v_project_id uuid;
  v_role text;
  v_form_id uuid := public.gen_random_uuid();
  v_endpoint_id text := 'frm_' || pg_catalog.encode(public.gen_random_bytes(24), 'hex');
begin
  if length(p_actor_id) not between 1 and 128
     or length(btrim(p_name)) not between 1 and 200
     or jsonb_typeof(p_definition) <> 'object'
     or p_definition ->> 'schemaVersion' is distinct from '1'
     or jsonb_typeof(p_definition -> 'fields') <> 'array'
     or jsonb_array_length(p_definition -> 'fields') not between 1 and 100
     or pg_column_size(p_definition) > 524288 then
    raise exception using errcode='22023', message='INVALID_FORM_DRAFT';
  end if;

  select workspace.id, membership.role, project.id
    into v_workspace_id, v_role, v_project_id
  from forms.workspace_memberships membership
  join forms.workspaces workspace on workspace.id=membership.workspace_id
  join forms.workspace_entitlements entitlement on entitlement.workspace_id=workspace.id
  join lateral (
    select projects.id from forms.projects
    where projects.workspace_id=workspace.id and projects.status='active'
    order by (projects.slug='default') desc, projects.created_at, projects.id limit 1
  ) project on true
  where membership.actor_id=p_actor_id and membership.status='active'
    and workspace.status='active' and entitlement.status in ('active','grace')
  order by (membership.role='owner') desc, (workspace.kind='personal') desc, workspace.created_at
  limit 1;

  if v_workspace_id is null or v_role not in ('owner','admin','editor') then
    raise exception using errcode='P0001', message='FORBIDDEN';
  end if;

  perform forms_private.apply_gauge_delta(
    v_workspace_id,'forms.total',1,5,'dashboard:form:create:'||v_form_id::text,
    'form',v_form_id::text,'form_created','user',p_actor_id
  );
  insert into forms.forms(id,workspace_id,project_id,name,created_by_actor_id,updated_by_actor_id)
    values(v_form_id,v_workspace_id,v_project_id,btrim(p_name),p_actor_id,p_actor_id);
  insert into forms.form_drafts(workspace_id,form_id,revision,schema_version,definition,updated_by_actor_id)
    values(v_workspace_id,v_form_id,1,1,p_definition,p_actor_id);
  insert into forms.form_endpoints(workspace_id,form_id,public_id,created_by_actor_id)
    values(v_workspace_id,v_form_id,v_endpoint_id,p_actor_id);
  insert into forms_audit.events(workspace_id,actor_type,actor_id,action,target_type,target_id,metadata)
    values(v_workspace_id,'user',p_actor_id,'form.created','form',v_form_id::text,jsonb_build_object('source','dashboard'));
  return jsonb_build_object('id',v_form_id,'name',btrim(p_name),'status','draft','revision',1,'endpointId',v_endpoint_id);
end;
$function$;

create function forms_api.update_dashboard_form(
  p_actor_id text, p_form_id uuid, p_expected_revision bigint,
  p_name text, p_description text, p_definition jsonb
) returns jsonb language plpgsql security definer set search_path = pg_catalog
as $function$
declare
  v_context record;
  v_revision bigint;
  v_status text;
  v_endpoint_id text;
begin
  if length(p_actor_id) not between 1 and 128 or p_expected_revision < 1
    or length(btrim(p_name)) not between 1 and 200
    or (p_description is not null and length(p_description) > 2000)
    or jsonb_typeof(p_definition) <> 'object'
    or p_definition ->> 'schemaVersion' is distinct from '1'
    or jsonb_typeof(p_definition -> 'fields') <> 'array'
    or jsonb_array_length(p_definition -> 'fields') not between 1 and 100
    or pg_column_size(p_definition) > 524288 then
    raise exception using errcode='22023', message='INVALID_FORM_DRAFT';
  end if;
  select * into v_context from forms_private.dashboard_form_context(p_actor_id,p_form_id);
  if not found or v_context.member_role not in ('owner','admin','editor') then
    raise exception using errcode='P0001', message='FORBIDDEN';
  end if;
  select revision into v_revision from forms.form_drafts
    where workspace_id=v_context.workspace_id and form_id=p_form_id for update;
  if v_revision <> p_expected_revision then
    raise exception using errcode='P0001', message='STALE_REVISION';
  end if;
  update forms.form_drafts set revision=revision+1, definition=p_definition,
    schema_version=1, updated_by_actor_id=p_actor_id, updated_at=clock_timestamp()
    where workspace_id=v_context.workspace_id and form_id=p_form_id
    returning revision into v_revision;
  update forms.forms set name=btrim(p_name),description=nullif(btrim(p_description),''),
    updated_by_actor_id=p_actor_id,updated_at=clock_timestamp(),lock_version=lock_version+1
    where workspace_id=v_context.workspace_id and id=p_form_id returning status into v_status;
  select public_id into v_endpoint_id from forms.form_endpoints
    where workspace_id=v_context.workspace_id and form_id=p_form_id and status='active';
  return jsonb_build_object('id',p_form_id,'name',btrim(p_name),'status',v_status,
    'revision',v_revision,'endpointId',v_endpoint_id,'definition',p_definition);
end;
$function$;

create function forms_api.duplicate_dashboard_form(p_actor_id text, p_form_id uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $function$
declare
  v_context record;
  v_source record;
  v_form_id uuid := public.gen_random_uuid();
  v_endpoint_id text := 'frm_' || pg_catalog.encode(public.gen_random_bytes(24), 'hex');
  v_name text;
begin
  select * into v_context from forms_private.dashboard_form_context(p_actor_id,p_form_id);
  if not found or v_context.member_role not in ('owner','admin','editor') then
    raise exception using errcode='P0001', message='FORBIDDEN';
  end if;
  select f.name,f.description,d.definition into v_source
    from forms.forms f join forms.form_drafts d on d.workspace_id=f.workspace_id and d.form_id=f.id
    where f.workspace_id=v_context.workspace_id and f.id=p_form_id;
  v_name := left(v_source.name || ' copy',200);
  perform forms_private.apply_gauge_delta(
    v_context.workspace_id,'forms.total',1,5,'dashboard:form:duplicate:'||v_form_id::text,
    'form',v_form_id::text,'form_created','user',p_actor_id
  );
  insert into forms.forms(id,workspace_id,project_id,name,description,created_by_actor_id,updated_by_actor_id)
    values(v_form_id,v_context.workspace_id,v_context.project_id,v_name,v_source.description,p_actor_id,p_actor_id);
  insert into forms.form_drafts(workspace_id,form_id,revision,schema_version,definition,updated_by_actor_id)
    values(v_context.workspace_id,v_form_id,1,1,v_source.definition,p_actor_id);
  insert into forms.form_endpoints(workspace_id,form_id,public_id,created_by_actor_id)
    values(v_context.workspace_id,v_form_id,v_endpoint_id,p_actor_id);
  return jsonb_build_object('id',v_form_id,'name',v_name,'status','draft','revision',1,'endpointId',v_endpoint_id);
end;
$function$;

create function forms_api.publish_dashboard_form(p_actor_id text,p_form_id uuid,p_expected_revision bigint)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $function$
declare
  v_context record;
  v_grant uuid := public.gen_random_uuid();
  v_operation text := 'dashboard-' || public.gen_random_uuid()::text;
begin
  select * into v_context from forms_private.dashboard_form_context(p_actor_id,p_form_id);
  if not found or v_context.member_role not in ('owner','admin','editor') then
    raise exception using errcode='P0001', message='FORBIDDEN';
  end if;
  return forms_api.publish_form(p_actor_id,p_form_id,p_expected_revision,v_operation,
    v_operation,'forms-dashboard',v_grant);
end;
$function$;

create function forms_api.list_submissions_v2(
  p_actor_id text,p_form_id uuid,p_query text default '',p_state text default 'inbox',
  p_sort text default 'newest',p_page integer default 1,p_page_size integer default 20
) returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare v_workspace_id uuid; v_total bigint; v_items jsonb;
begin
  select f.workspace_id into v_workspace_id from forms.forms f
  join forms.workspace_memberships m on m.workspace_id=f.workspace_id
  where f.id=p_form_id and m.actor_id=p_actor_id and m.status='active' limit 1;
  if v_workspace_id is null then raise exception using errcode='P0001', message='FORBIDDEN'; end if;
  if p_state not in ('inbox','spam','archived') or p_sort not in ('newest','oldest') then
    raise exception using errcode='22023', message='INVALID_FILTER';
  end if;
  p_page := greatest(coalesce(p_page,1),1); p_page_size := least(greatest(coalesce(p_page_size,20),1),100);
  select count(*) into v_total from forms.submissions s
    where s.workspace_id=v_workspace_id and s.form_id=p_form_id and s.review_state=p_state
      and (coalesce(btrim(p_query),'')='' or s.values::text ilike '%'||btrim(p_query)||'%');
  select coalesce(jsonb_agg(item),'[]'::jsonb) into v_items from (
    select jsonb_build_object('id',s.id,'formId',s.form_id,'receivedAt',s.received_at,
      'values',s.values,'reviewState',s.review_state,
      'fileCount',(select count(*) from forms.submission_files sf where sf.submission_id=s.id),
      'files',coalesce((select jsonb_agg(jsonb_build_object('id',sf.id,'submissionId',sf.submission_id,
        'fieldKey',sf.field_key,'fileName',sf.file_name,'contentType',sf.content_type,
        'byteSize',sf.byte_size,'scanStatus',sf.scan_status) order by sf.created_at,sf.id)
        from forms.submission_files sf where sf.submission_id=s.id),'[]'::jsonb)) item,
      s.received_at,s.id
    from forms.submissions s
    where s.workspace_id=v_workspace_id and s.form_id=p_form_id and s.review_state=p_state
      and (coalesce(btrim(p_query),'')='' or s.values::text ilike '%'||btrim(p_query)||'%')
    order by case when p_sort='oldest' then s.received_at end asc,
      case when p_sort='newest' then s.received_at end desc,
      case when p_sort='oldest' then s.id end asc,
      case when p_sort='newest' then s.id end desc
    limit p_page_size offset (p_page-1)*p_page_size
  ) rows;
  return jsonb_build_object('items',v_items,'total',v_total,'page',p_page,'pageSize',p_page_size,
    'pages',greatest(1,ceil(v_total::numeric/p_page_size)::integer));
end;
$function$;

create function forms_api.set_submission_review_state(
  p_actor_id text,p_submission_id uuid,p_state text
) returns boolean language plpgsql security definer set search_path = pg_catalog
as $function$
begin
  if p_state not in ('inbox','spam','archived') then
    raise exception using errcode='22023', message='INVALID_REVIEW_STATE';
  end if;
  update forms.submissions s set review_state=p_state,reviewed_at=clock_timestamp(),reviewed_by_actor_id=p_actor_id
  where s.id=p_submission_id and exists (
    select 1 from forms.workspace_memberships m
    where m.workspace_id=s.workspace_id and m.actor_id=p_actor_id and m.status='active' and m.role in ('owner','admin','editor')
  );
  return found;
end;
$function$;

create function forms_api.accept_submission_v2(
  p_public_id text,p_idempotency_key text,p_values jsonb,p_origin text,p_ip_hash_hex text,p_files jsonb
) returns jsonb language plpgsql security definer set search_path = pg_catalog
as $function$
declare v_result jsonb; v_submission_id uuid; v_workspace_id uuid; v_form_id uuid; v_file jsonb; v_content bytea; v_count int := 0;
begin
  if p_files is null then p_files := '[]'::jsonb; end if;
  if jsonb_typeof(p_files)<>'array' or jsonb_array_length(p_files)>10 then
    raise exception using errcode='22023', message='INVALID_FILES';
  end if;
  v_result := forms_api.accept_submission(p_public_id,p_idempotency_key,p_values,p_origin,p_ip_hash_hex);
  v_submission_id := (v_result->>'submissionId')::uuid;
  select s.workspace_id,s.form_id into v_workspace_id,v_form_id from forms.submissions s where s.id=v_submission_id;
  for v_file in select value from jsonb_array_elements(p_files) loop
    if coalesce(v_file->>'fieldKey','') !~ '^[a-z][a-z0-9_]*$'
      or length(coalesce(v_file->>'fileName','')) not between 1 and 240
      or length(coalesce(v_file->>'contentType','')) not between 1 and 160
      or length(coalesce(v_file->>'contentBase64','')) > 2700000 then
      raise exception using errcode='22023', message='INVALID_FILE';
    end if;
    begin v_content := decode(v_file->>'contentBase64','base64');
    exception when others then raise exception using errcode='22023', message='INVALID_FILE'; end;
    if octet_length(v_content) not between 1 and 2000000 then
      raise exception using errcode='22023', message='INVALID_FILE';
    end if;
    insert into forms.submission_files(workspace_id,form_id,submission_id,field_key,file_name,content_type,byte_size,content)
      values(v_workspace_id,v_form_id,v_submission_id,v_file->>'fieldKey',v_file->>'fileName',v_file->>'contentType',octet_length(v_content),v_content)
      on conflict(submission_id,field_key) do nothing;
    v_count := v_count+1;
  end loop;
  return v_result || jsonb_build_object('fileCount',v_count);
end;
$function$;

create function forms_api.record_blocked_submission(
  p_public_id text,p_reason text,p_origin text,p_ip_hash_hex text
) returns void language plpgsql security definer set search_path = pg_catalog
as $function$
declare v_endpoint forms.form_endpoints%rowtype; v_ip_hash bytea;
begin
  if p_reason not in ('honeypot','challenge_failed','validation_failed','rate_limited','origin_not_allowed','request_too_large','invalid_payload','unsupported_media_type')
    or p_ip_hash_hex !~ '^[0-9a-f]{64}$' then return; end if;
  select * into v_endpoint from forms.form_endpoints where public_id=p_public_id;
  if not found then return; end if;
  v_ip_hash:=decode(p_ip_hash_hex,'hex');
  insert into forms.blocked_submission_events(workspace_id,form_id,endpoint_id,reason,origin,ip_hash,window_started_at)
    values(v_endpoint.workspace_id,v_endpoint.form_id,v_endpoint.id,p_reason,p_origin,v_ip_hash,date_trunc('hour',clock_timestamp()))
  on conflict(endpoint_id,ip_hash,reason,window_started_at) do update
    set event_count=forms.blocked_submission_events.event_count+1,last_occurred_at=clock_timestamp();
end;
$function$;

create function forms_api.list_blocked_submissions(p_actor_id text,p_form_id uuid,p_page integer default 1,p_page_size integer default 20)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare v_workspace_id uuid; v_total bigint; v_items jsonb;
begin
  select f.workspace_id into v_workspace_id from forms.forms f join forms.workspace_memberships m on m.workspace_id=f.workspace_id
    where f.id=p_form_id and m.actor_id=p_actor_id and m.status='active' limit 1;
  if v_workspace_id is null then raise exception using errcode='P0001',message='FORBIDDEN'; end if;
  p_page:=greatest(coalesce(p_page,1),1); p_page_size:=least(greatest(coalesce(p_page_size,20),1),100);
  select count(*) into v_total from forms.blocked_submission_events where workspace_id=v_workspace_id and form_id=p_form_id;
  select coalesce(jsonb_agg(item),'[]'::jsonb) into v_items from (
    select jsonb_build_object('id',b.id,'reason',b.reason,'origin',b.origin,'eventCount',b.event_count,
      'lastOccurredAt',b.last_occurred_at) item
    from forms.blocked_submission_events b where b.workspace_id=v_workspace_id and b.form_id=p_form_id
    order by b.last_occurred_at desc,b.id desc limit p_page_size offset (p_page-1)*p_page_size
  ) rows;
  return jsonb_build_object('items',v_items,'total',v_total,'page',p_page,'pageSize',p_page_size,
    'pages',greatest(1,ceil(v_total::numeric/p_page_size)::integer));
end;
$function$;

create function forms_api.list_submission_files(p_actor_id text,p_submission_id uuid)
returns setof jsonb language sql stable security definer set search_path = pg_catalog
as $function$
  select jsonb_build_object('id',sf.id,'submissionId',sf.submission_id,'fieldKey',sf.field_key,
    'fileName',sf.file_name,'contentType',sf.content_type,'byteSize',sf.byte_size,'scanStatus',sf.scan_status)
  from forms.submission_files sf join forms.workspace_memberships m on m.workspace_id=sf.workspace_id
  where sf.submission_id=p_submission_id and m.actor_id=p_actor_id and m.status='active'
  order by sf.created_at,sf.id
$function$;

create function forms_api.get_submission_file(p_actor_id text,p_file_id uuid)
returns jsonb language sql stable security definer set search_path = pg_catalog
as $function$
  select jsonb_build_object('fileName',sf.file_name,'contentType',sf.content_type,'byteSize',sf.byte_size,
    'scanStatus',sf.scan_status,'contentBase64',encode(sf.content,'base64'))
  from forms.submission_files sf join forms.workspace_memberships m on m.workspace_id=sf.workspace_id
  where sf.id=p_file_id and m.actor_id=p_actor_id and m.status='active'
$function$;

alter table forms.submission_files enable row level security;
alter table forms.submission_files force row level security;
create policy owner_full_access on forms.submission_files for all to jobing_forms_owner using(true) with check(true);
alter table forms.blocked_submission_events enable row level security;
alter table forms.blocked_submission_events force row level security;
create policy owner_full_access on forms.blocked_submission_events for all to jobing_forms_owner using(true) with check(true);

revoke all on forms.submission_files,forms.blocked_submission_events from public,jobing_forms_control,jobing_forms_sync,jobing_forms_public,jobing_forms_ingest,jobing_forms_worker,jobing_forms_auditor;
revoke execute on function forms_private.dashboard_form_context(text,uuid) from public,jobing_forms_control,jobing_forms_sync,jobing_forms_public,jobing_forms_ingest,jobing_forms_worker,jobing_forms_auditor;
revoke execute on function forms_api.create_dashboard_form(text,text,jsonb),forms_api.update_dashboard_form(text,uuid,bigint,text,text,jsonb),
  forms_api.duplicate_dashboard_form(text,uuid),forms_api.publish_dashboard_form(text,uuid,bigint),
  forms_api.list_submissions_v2(text,uuid,text,text,text,integer,integer),forms_api.set_submission_review_state(text,uuid,text),
  forms_api.accept_submission_v2(text,text,jsonb,text,text,jsonb),forms_api.record_blocked_submission(text,text,text,text),
  forms_api.list_blocked_submissions(text,uuid,integer,integer),forms_api.list_submission_files(text,uuid),forms_api.get_submission_file(text,uuid)
  from public;
grant execute on function forms_api.create_dashboard_form(text,text,jsonb),forms_api.update_dashboard_form(text,uuid,bigint,text,text,jsonb),
  forms_api.duplicate_dashboard_form(text,uuid),forms_api.publish_dashboard_form(text,uuid,bigint),
  forms_api.list_submissions_v2(text,uuid,text,text,text,integer,integer),forms_api.set_submission_review_state(text,uuid,text),
  forms_api.list_blocked_submissions(text,uuid,integer,integer),forms_api.list_submission_files(text,uuid),forms_api.get_submission_file(text,uuid)
  to jobing_forms_control;
grant execute on function forms_api.accept_submission_v2(text,text,jsonb,text,text,jsonb),forms_api.record_blocked_submission(text,text,text,text)
  to jobing_forms_ingest;

reset role;
