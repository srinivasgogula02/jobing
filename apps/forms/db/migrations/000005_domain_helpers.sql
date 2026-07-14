set role jobing_forms_owner;

create function forms_private.begin_idempotency(
  p_scope_hash bytea,
  p_operation text,
  p_operation_id text,
  p_request_hash bytea
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_inserted boolean;
  v_existing forms_private.idempotency_records%rowtype;
begin
  if octet_length(p_scope_hash) <> 32 or octet_length(p_request_hash) <> 32 then
    raise exception using errcode = '22023', message = 'INVALID_IDEMPOTENCY_HASH';
  end if;

  -- Bound table growth and permit reuse only after the seven-day contract has
  -- expired. Cleanup is intentionally small so API latency remains bounded.
  with expired as (
    select records.scope_hash, records.operation, records.operation_id
    from forms_private.idempotency_records as records
    where records.expires_at < clock_timestamp()
    order by records.expires_at
    limit 100
  )
  delete from forms_private.idempotency_records as records
  using expired
  where records.scope_hash = expired.scope_hash
    and records.operation = expired.operation
    and records.operation_id = expired.operation_id;

  insert into forms_private.idempotency_records (
    scope_hash, operation, operation_id, request_hash, state, expires_at
  ) values (
    p_scope_hash, p_operation, p_operation_id, p_request_hash, 'in_progress', clock_timestamp() + interval '7 days'
  )
  on conflict do nothing
  returning true into v_inserted;

  if coalesce(v_inserted, false) then
    return null;
  end if;

  select * into v_existing
  from forms_private.idempotency_records
  where scope_hash = p_scope_hash
    and operation = p_operation
    and operation_id = p_operation_id
  for update;

  if v_existing.request_hash <> p_request_hash then
    raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
  end if;
  if v_existing.state = 'completed' then
    return v_existing.response_body;
  end if;

  -- An API mutation creates and completes this row in one transaction. A
  -- durable in_progress row therefore indicates an invalid manual write.
  raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_IN_PROGRESS';
end
$function$;

create function forms_private.complete_idempotency(
  p_scope_hash bytea,
  p_operation text,
  p_operation_id text,
  p_response jsonb,
  p_resource_type text,
  p_resource_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  update forms_private.idempotency_records
  set state = 'completed',
      response_body = p_response,
      resource_type = p_resource_type,
      resource_id = p_resource_id,
      completed_at = clock_timestamp()
  where scope_hash = p_scope_hash
    and operation = p_operation
    and operation_id = p_operation_id
    and state = 'in_progress';

  if not found then
    raise exception using errcode = '55000', message = 'IDEMPOTENCY_RECORD_MISSING';
  end if;
end
$function$;

create function forms_private.apply_gauge_delta(
  p_workspace_id uuid,
  p_metric_key text,
  p_delta bigint,
  p_default_hard_limit bigint,
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
  v_hard_limit bigint;
  v_limit_found boolean;
  v_used bigint;
  v_inserted boolean;
begin
  if p_delta = 0 then return; end if;

  select limits.hard_limit, true into v_hard_limit, v_limit_found
  from forms.entitlement_limits as limits
  where limits.workspace_id = p_workspace_id
    and limits.metric_key = p_metric_key;

  if not coalesce(v_limit_found, false) then
    v_hard_limit := p_default_hard_limit;
  end if;

  insert into forms.usage_counters (
    workspace_id, metric_key, bucket_key, used, reserved, limit_snapshot
  ) values (
    p_workspace_id, p_metric_key, 'current', 0, 0, v_hard_limit
  )
  on conflict (workspace_id, metric_key, bucket_key) do nothing;

  select counters.used into v_used
  from forms.usage_counters as counters
  where counters.workspace_id = p_workspace_id
    and counters.metric_key = p_metric_key
    and counters.bucket_key = 'current'
  for update;

  if v_used + p_delta < 0 then
    raise exception using errcode = '23514', message = 'USAGE_COUNTER_UNDERFLOW';
  end if;
  if p_delta > 0 and v_hard_limit is not null and v_used + p_delta > v_hard_limit then
    raise exception using errcode = 'P0001', message = 'FORM_LIMIT_REACHED';
  end if;

  insert into forms.usage_ledger (
    workspace_id, metric_key, bucket_key, delta, dedupe_key,
    source_type, source_id, reason, actor_type, actor_id
  ) values (
    p_workspace_id, p_metric_key, 'current', p_delta, p_dedupe_key,
    p_source_type, p_source_id, p_reason, p_actor_type, p_actor_id
  )
  on conflict (workspace_id, metric_key, dedupe_key) do nothing
  returning true into v_inserted;

  if coalesce(v_inserted, false) then
    update forms.usage_counters
    set used = used + p_delta,
        limit_snapshot = v_hard_limit,
        version = version + 1,
        updated_at = clock_timestamp()
    where workspace_id = p_workspace_id
      and metric_key = p_metric_key
      and bucket_key = 'current';
  end if;
end
$function$;

create function forms_api.claim_outbox(
  p_worker_id text,
  p_batch_size integer default 25,
  p_lease_seconds integer default 30
)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  if length(p_worker_id) not between 1 and 128
     or p_batch_size not between 1 and 100
     or p_lease_seconds not between 5 and 300 then
    raise exception using errcode = '22023', message = 'INVALID_OUTBOX_CLAIM';
  end if;

  return query
  with claimable as (
    select events.sequence
    from forms_private.outbox_events as events
    where events.processed_at is null
      and events.dead_lettered_at is null
      and events.available_at <= clock_timestamp()
      and (events.lease_until is null or events.lease_until < clock_timestamp())
    order by events.available_at, events.sequence
    for update skip locked
    limit p_batch_size
  ), claimed as (
    update forms_private.outbox_events as events
    set lease_owner = p_worker_id,
        lease_until = clock_timestamp() + make_interval(secs => p_lease_seconds),
        attempt_count = events.attempt_count + 1
    from claimable
    where events.sequence = claimable.sequence
    returning events.*
  )
  select jsonb_build_object(
    'eventId', claimed.event_id,
    'topic', claimed.topic,
    'aggregateType', claimed.aggregate_type,
    'aggregateId', claimed.aggregate_id,
    'payload', claimed.payload,
    'attempt', claimed.attempt_count,
    'leaseUntil', claimed.lease_until
  )
  from claimed
  order by claimed.sequence;
end
$function$;

create function forms_api.ack_outbox(p_worker_id text, p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  update forms_private.outbox_events
  set processed_at = clock_timestamp(),
      lease_owner = null,
      lease_until = null,
      last_error_code = null,
      last_error_detail = null
  where event_id = p_event_id
    and lease_owner = p_worker_id
    and processed_at is null
    and dead_lettered_at is null;
  return found;
end
$function$;

create function forms_api.retry_outbox(
  p_worker_id text,
  p_event_id uuid,
  p_error_code text,
  p_error_detail text,
  p_delay_seconds integer,
  p_dead_letter boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  if length(p_error_code) not between 1 and 64
     or length(p_error_detail) > 1000
     or p_delay_seconds not between 0 and 86400 then
    raise exception using errcode = '22023', message = 'INVALID_OUTBOX_RETRY';
  end if;

  update forms_private.outbox_events
  set available_at = clock_timestamp() + make_interval(secs => p_delay_seconds),
      lease_owner = null,
      lease_until = null,
      dead_lettered_at = case when p_dead_letter then clock_timestamp() else null end,
      last_error_code = p_error_code,
      last_error_detail = nullif(p_error_detail, '')
  where event_id = p_event_id
    and lease_owner = p_worker_id
    and processed_at is null
    and dead_lettered_at is null;
  return found;
end
$function$;

reset role;
