set role jobing_forms_owner;

create table forms.workspaces (
  id uuid primary key default public.gen_random_uuid(),
  source text not null default 'jobing' check (source in ('jobing', 'clerk')),
  source_workspace_id text not null check (length(source_workspace_id) between 1 and 160),
  kind text not null check (kind in ('personal', 'team')),
  display_name text not null check (length(btrim(display_name)) between 1 and 160),
  status text not null check (status in ('active', 'suspended', 'deleting', 'deleted')),
  source_version bigint not null check (source_version >= 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  unique (source, source_workspace_id),
  check (deleted_at is null or status in ('deleting', 'deleted'))
);

create table forms.workspace_memberships (
  workspace_id uuid not null references forms.workspaces(id) on delete restrict,
  actor_id text not null check (length(actor_id) between 1 and 128),
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  status text not null check (status in ('active', 'removed')),
  source_version bigint not null check (source_version >= 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  removed_at timestamptz,
  primary key (workspace_id, actor_id),
  check ((status = 'removed') = (removed_at is not null))
);

create index workspace_memberships_actor_idx
  on forms.workspace_memberships(actor_id, status, workspace_id);

create table forms.usage_metrics (
  metric_key text primary key check (metric_key ~ '^[a-z][a-z0-9_.]{1,63}$'),
  accounting_kind text not null check (accounting_kind in ('gauge', 'counter')),
  period_kind text not null check (period_kind in ('none', 'month')),
  unit text not null check (length(unit) between 1 and 32),
  description text not null check (length(description) between 1 and 240),
  check ((accounting_kind = 'gauge' and period_kind = 'none') or accounting_kind = 'counter')
);

insert into forms.usage_metrics (metric_key, accounting_kind, period_kind, unit, description) values
  ('forms.total', 'gauge', 'none', 'forms', 'Non-trashed forms in the workspace.'),
  ('forms.published', 'gauge', 'none', 'forms', 'Published or paused forms in the workspace.'),
  ('submissions.accepted', 'counter', 'month', 'submissions', 'Accepted non-spam submissions in a calendar month.'),
  ('storage.bytes', 'gauge', 'none', 'bytes', 'Private attachment storage currently retained.'),
  ('team.seats', 'gauge', 'none', 'members', 'Active workspace memberships.');

create table forms.workspace_entitlements (
  workspace_id uuid primary key references forms.workspaces(id) on delete restrict,
  plan_key text not null check (plan_key ~ '^[a-z][a-z0-9_-]{0,63}$'),
  status text not null check (status in ('active', 'grace', 'suspended', 'cancelled')),
  source_version bigint not null check (source_version >= 0),
  features jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object'),
  effective_from timestamptz not null default clock_timestamp(),
  effective_until timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  check (effective_until is null or effective_until > effective_from)
);

create table forms.entitlement_limits (
  workspace_id uuid not null references forms.workspaces(id) on delete restrict,
  metric_key text not null references forms.usage_metrics(metric_key) on delete restrict,
  soft_limit bigint,
  hard_limit bigint,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (workspace_id, metric_key),
  check (soft_limit is null or soft_limit >= 0),
  check (hard_limit is null or hard_limit >= 0),
  check (soft_limit is null or hard_limit is null or soft_limit <= hard_limit)
);

create table forms.usage_counters (
  workspace_id uuid not null references forms.workspaces(id) on delete restrict,
  metric_key text not null references forms.usage_metrics(metric_key) on delete restrict,
  bucket_key text not null check (length(bucket_key) between 1 and 32),
  period_start timestamptz,
  period_end timestamptz,
  used bigint not null default 0 check (used >= 0),
  reserved bigint not null default 0 check (reserved >= 0),
  limit_snapshot bigint check (limit_snapshot is null or limit_snapshot >= 0),
  version bigint not null default 0 check (version >= 0),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (workspace_id, metric_key, bucket_key),
  check ((period_start is null and period_end is null) or (period_start is not null and period_end > period_start))
);

create table forms.usage_ledger (
  id uuid primary key default public.gen_random_uuid(),
  workspace_id uuid not null references forms.workspaces(id) on delete restrict,
  metric_key text not null references forms.usage_metrics(metric_key) on delete restrict,
  bucket_key text not null check (length(bucket_key) between 1 and 32),
  delta bigint not null check (delta <> 0),
  dedupe_key text not null check (length(dedupe_key) between 1 and 240),
  source_type text not null check (length(source_type) between 1 and 64),
  source_id text check (source_id is null or length(source_id) between 1 and 240),
  reason text not null check (length(reason) between 1 and 160),
  actor_type text not null check (actor_type in ('user', 'mcp', 'system', 'worker')),
  actor_id text check (actor_id is null or length(actor_id) <= 128),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default clock_timestamp(),
  unique (workspace_id, metric_key, dedupe_key)
);

create index usage_ledger_workspace_metric_time_idx
  on forms.usage_ledger(workspace_id, metric_key, occurred_at desc, id);

reset role;
