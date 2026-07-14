set role jobing_forms_owner;

create table forms.submissions (
  id uuid primary key default public.gen_random_uuid(),
  workspace_id uuid not null,
  form_id uuid not null,
  form_version_id uuid not null,
  endpoint_id uuid not null,
  idempotency_key text not null check (length(idempotency_key) between 8 and 200),
  values jsonb not null check (jsonb_typeof(values) = 'object' and pg_column_size(values) <= 262144),
  origin text check (origin is null or length(origin) <= 2048),
  ip_hash bytea not null check (octet_length(ip_hash) = 32),
  received_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '365 days'),
  unique (workspace_id, form_id, idempotency_key),
  foreign key (workspace_id, form_id) references forms.forms(workspace_id, id) on delete restrict,
  foreign key (workspace_id, form_id, form_version_id) references forms.form_versions(workspace_id, form_id, id) on delete restrict,
  foreign key (workspace_id, form_id, endpoint_id) references forms.form_endpoints(workspace_id, form_id, id) on delete restrict
);

create index submissions_form_received_idx on forms.submissions(workspace_id, form_id, received_at desc, id desc);
create index submissions_expiry_idx on forms.submissions(expires_at);

create table forms_private.submission_rate_limits (
  endpoint_id uuid not null,
  ip_hash bytea not null check (octet_length(ip_hash) = 32),
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (endpoint_id, ip_hash, window_started_at)
);

create function forms_api.get_public_form(p_public_id text)
returns jsonb language sql stable security definer set search_path = pg_catalog
as $function$
  select jsonb_build_object(
    'formId', f.id, 'endpointId', e.public_id, 'versionId', v.id,
    'version', v.version_number, 'name', f.name, 'definition', v.definition
  )
  from forms.form_endpoints e
  join forms.forms f on f.workspace_id=e.workspace_id and f.id=e.form_id
  join forms.form_versions v on v.workspace_id=f.workspace_id and v.form_id=f.id and v.id=f.published_version_id
  where e.public_id=p_public_id and e.status in ('active','retiring')
    and (e.accept_until is null or e.accept_until >= clock_timestamp()) and f.status='published'
$function$;

create function forms_api.accept_submission(
  p_public_id text, p_idempotency_key text, p_values jsonb, p_origin text, p_ip_hash_hex text
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
  if length(p_idempotency_key) not between 8 and 200 or jsonb_typeof(p_values) <> 'object'
     or pg_column_size(p_values) > 262144 or p_ip_hash_hex !~ '^[0-9a-f]{64}$' then
    raise exception using errcode='22023', message='INVALID_SUBMISSION';
  end if;
  v_ip_hash := decode(p_ip_hash_hex, 'hex');
  select e.* into v_endpoint from forms.form_endpoints e where e.public_id=p_public_id for update;
  if not found or v_endpoint.status not in ('active','retiring') or (v_endpoint.accept_until is not null and v_endpoint.accept_until < clock_timestamp()) then
    raise exception using errcode='P0001', message='FORM_NOT_FOUND';
  end if;
  select f.* into v_form from forms.forms f where f.workspace_id=v_endpoint.workspace_id and f.id=v_endpoint.form_id for update;
  if v_form.status <> 'published' then raise exception using errcode='P0001', message='FORM_NOT_ACCEPTING'; end if;
  select v.definition into v_definition from forms.form_versions v where v.id=v_form.published_version_id;
  v_allowed := coalesce(v_definition #> '{settings,allowedOrigins}', '[]'::jsonb);
  if p_origin is not null and jsonb_array_length(v_allowed) > 0 and not (v_allowed ? p_origin) then
    raise exception using errcode='P0001', message='ORIGIN_NOT_ALLOWED';
  end if;
  insert into forms_private.submission_rate_limits(endpoint_id,ip_hash,window_started_at)
  values(v_endpoint.id,v_ip_hash,date_trunc('minute',clock_timestamp()))
  on conflict(endpoint_id,ip_hash,window_started_at) do update set request_count=forms_private.submission_rate_limits.request_count+1
  returning request_count into v_count;
  if v_count > 10 then raise exception using errcode='P0001', message='RATE_LIMITED'; end if;
  insert into forms.submissions(workspace_id,form_id,form_version_id,endpoint_id,idempotency_key,values,origin,ip_hash)
  values(v_form.workspace_id,v_form.id,v_form.published_version_id,v_endpoint.id,p_idempotency_key,p_values,p_origin,v_ip_hash)
  on conflict(workspace_id,form_id,idempotency_key) do nothing returning id into v_submission_id;
  if v_submission_id is null then
    select id into v_submission_id from forms.submissions where workspace_id=v_form.workspace_id and form_id=v_form.id and idempotency_key=p_idempotency_key;
  else
    perform forms_private.apply_gauge_delta(v_form.workspace_id,'submissions.accepted',1,50,'submission:'||v_submission_id,'submission',v_submission_id::text,'submission_accepted','system',null);
  end if;
  return jsonb_build_object('submissionId',v_submission_id,'message',coalesce(v_definition #>> '{confirmation,message}','Thanks — your response was received.'),'redirectUrl',v_definition #>> '{confirmation,redirectUrl}');
end
$function$;

create function forms_api.list_submissions(p_actor_id text,p_form_id uuid,p_limit integer default 50)
returns setof jsonb language sql stable security definer set search_path = pg_catalog
as $function$
  select jsonb_build_object('id',s.id,'formId',s.form_id,'receivedAt',s.received_at,'values',s.values)
  from forms.submissions s join forms.workspace_memberships m on m.workspace_id=s.workspace_id
  where m.actor_id=p_actor_id and m.status='active' and s.form_id=p_form_id
  order by s.received_at desc,s.id desc limit least(greatest(p_limit,1),100)
$function$;

create function forms_api.get_submission(p_actor_id text,p_submission_id uuid)
returns jsonb language sql stable security definer set search_path = pg_catalog
as $function$
  select jsonb_build_object('id',s.id,'formId',s.form_id,'formVersionId',s.form_version_id,'receivedAt',s.received_at,'values',s.values)
  from forms.submissions s join forms.workspace_memberships m on m.workspace_id=s.workspace_id
  where m.actor_id=p_actor_id and m.status='active' and s.id=p_submission_id
$function$;

alter table forms.submissions enable row level security; alter table forms.submissions force row level security;
create policy owner_full_access on forms.submissions for all to jobing_forms_owner using(true) with check(true);
alter table forms_private.submission_rate_limits enable row level security; alter table forms_private.submission_rate_limits force row level security;
create policy owner_full_access on forms_private.submission_rate_limits for all to jobing_forms_owner using(true) with check(true);
revoke all on forms.submissions, forms_private.submission_rate_limits from public,jobing_forms_control,jobing_forms_sync,jobing_forms_public,jobing_forms_ingest,jobing_forms_worker,jobing_forms_auditor;
revoke execute on function forms_api.get_public_form(text), forms_api.accept_submission(text,text,jsonb,text,text), forms_api.list_submissions(text,uuid,integer), forms_api.get_submission(text,uuid) from public;
grant usage on schema forms_api to jobing_forms_ingest;
grant execute on function forms_api.get_public_form(text), forms_api.accept_submission(text,text,jsonb,text,text) to jobing_forms_ingest;
grant execute on function forms_api.list_submissions(text,uuid,integer), forms_api.get_submission(text,uuid) to jobing_forms_control;
reset role;
