set role jobing_forms_owner;

create table forms_private.request_nonces (
  key_id text not null check (length(key_id) between 1 and 128),
  nonce text not null check (length(nonce) between 16 and 240),
  expires_at timestamptz not null,
  claimed_at timestamptz not null default clock_timestamp(),
  primary key (key_id, nonce)
);

create index request_nonces_expiry_idx
  on forms_private.request_nonces(expires_at);

create table forms_private.idempotency_records (
  scope_hash bytea not null check (octet_length(scope_hash) = 32),
  operation text not null check (operation ~ '^[a-z][a-z0-9_.]{1,63}$'),
  operation_id text not null check (length(operation_id) between 8 and 200),
  request_hash bytea not null check (octet_length(request_hash) = 32),
  state text not null check (state in ('in_progress', 'completed')),
  response_body jsonb,
  resource_type text check (resource_type is null or length(resource_type) between 1 and 64),
  resource_id uuid,
  created_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  expires_at timestamptz not null,
  primary key (scope_hash, operation, operation_id),
  check ((state = 'completed') = (completed_at is not null and response_body is not null)),
  check (expires_at > created_at)
);

create index idempotency_records_expiry_idx
  on forms_private.idempotency_records(expires_at);

create table forms_private.inbox_events (
  source text not null check (source ~ '^[a-z][a-z0-9_.-]{0,63}$'),
  external_event_id text not null check (length(external_event_id) between 8 and 240),
  body_hash bytea not null check (octet_length(body_hash) = 32),
  state text not null check (state in ('processing', 'completed')),
  normalized_result jsonb,
  received_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  primary key (source, external_event_id),
  check ((state = 'completed') = (completed_at is not null and normalized_result is not null))
);

create table forms_audit.events (
  sequence bigint generated always as identity primary key,
  event_id uuid not null unique default public.gen_random_uuid(),
  workspace_id uuid,
  actor_type text not null check (actor_type in ('user', 'mcp', 'system', 'worker')),
  actor_id text check (actor_id is null or length(actor_id) <= 128),
  action text not null check (action ~ '^[a-z][a-z0-9_.]{1,95}$'),
  target_type text not null check (length(target_type) between 1 and 64),
  target_id text check (target_id is null or length(target_id) <= 240),
  request_id text check (request_id is null or length(request_id) <= 240),
  network_hash bytea check (network_hash is null or octet_length(network_hash) = 32),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default clock_timestamp()
);

create index audit_events_workspace_time_idx
  on forms_audit.events(workspace_id, created_at desc, sequence desc);

create index audit_events_target_time_idx
  on forms_audit.events(target_type, target_id, created_at desc, sequence desc);

create table forms_private.outbox_events (
  sequence bigint generated always as identity primary key,
  event_id uuid not null unique default public.gen_random_uuid(),
  workspace_id uuid,
  topic text not null check (topic ~ '^[a-z][a-z0-9_.]{1,95}$'),
  aggregate_type text not null check (length(aggregate_type) between 1 and 64),
  aggregate_id text not null check (length(aggregate_id) between 1 and 240),
  dedupe_key text not null check (length(dedupe_key) between 1 and 240),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  available_at timestamptz not null default clock_timestamp(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  lease_owner text check (lease_owner is null or length(lease_owner) <= 128),
  lease_until timestamptz,
  processed_at timestamptz,
  dead_lettered_at timestamptz,
  last_error_code text check (last_error_code is null or length(last_error_code) <= 64),
  last_error_detail text check (last_error_detail is null or length(last_error_detail) <= 1000),
  created_at timestamptz not null default clock_timestamp(),
  unique (topic, dedupe_key),
  check ((lease_owner is null) = (lease_until is null)),
  check (processed_at is null or dead_lettered_at is null)
);

create index outbox_pending_idx
  on forms_private.outbox_events(available_at, sequence)
  where processed_at is null and dead_lettered_at is null;

create trigger usage_ledger_immutable
before update or delete on forms.usage_ledger
for each row execute function forms_private.reject_immutable_change();

create trigger audit_events_immutable
before update or delete on forms_audit.events
for each row execute function forms_private.reject_immutable_change();

reset role;
