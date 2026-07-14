set role jobing_forms_owner;

create table forms.projects (
  id uuid primary key default public.gen_random_uuid(),
  workspace_id uuid not null references forms.workspaces(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z][a-z0-9-]{0,62}[a-z0-9]$' or slug ~ '^[a-z]$'),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by_actor_id text not null check (length(created_by_actor_id) between 1 and 128),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (workspace_id, id)
);

create unique index projects_workspace_slug_idx
  on forms.projects(workspace_id, lower(slug));

create table forms.forms (
  id uuid primary key default public.gen_random_uuid(),
  workspace_id uuid not null references forms.workspaces(id) on delete restrict,
  project_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 200),
  description text check (description is null or length(description) <= 2000),
  status text not null default 'draft' check (status in ('draft', 'published', 'paused', 'archived', 'trashed')),
  published_version_id uuid,
  version_sequence integer not null default 0 check (version_sequence >= 0),
  lock_version bigint not null default 0 check (lock_version >= 0),
  created_by_actor_id text not null check (length(created_by_actor_id) between 1 and 128),
  updated_by_actor_id text not null check (length(updated_by_actor_id) between 1 and 128),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  published_at timestamptz,
  paused_at timestamptz,
  archived_at timestamptz,
  trashed_at timestamptz,
  unique (workspace_id, id),
  foreign key (workspace_id, project_id) references forms.projects(workspace_id, id) on delete restrict,
  check ((published_version_id is null and version_sequence = 0) or (published_version_id is not null and version_sequence > 0)),
  check (status not in ('published', 'paused') or published_version_id is not null),
  check (trashed_at is null or status = 'trashed'),
  check (archived_at is null or status in ('archived', 'trashed'))
);

create index forms_workspace_status_updated_idx
  on forms.forms(workspace_id, status, updated_at desc, id);

create table forms.form_drafts (
  workspace_id uuid not null,
  form_id uuid not null,
  revision bigint not null default 1 check (revision > 0),
  schema_version integer not null check (schema_version > 0),
  definition jsonb not null check (jsonb_typeof(definition) = 'object'),
  content_hash bytea not null check (octet_length(content_hash) = 32),
  based_on_version_id uuid,
  updated_by_actor_id text not null check (length(updated_by_actor_id) between 1 and 128),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (workspace_id, form_id),
  foreign key (workspace_id, form_id) references forms.forms(workspace_id, id) on delete restrict
);

create table forms.form_versions (
  id uuid primary key default public.gen_random_uuid(),
  workspace_id uuid not null,
  form_id uuid not null,
  version_number integer not null check (version_number > 0),
  schema_version integer not null check (schema_version > 0),
  definition jsonb not null check (jsonb_typeof(definition) = 'object'),
  content_hash bytea not null check (octet_length(content_hash) = 32),
  source_draft_revision bigint not null check (source_draft_revision > 0),
  published_by_actor_id text not null check (length(published_by_actor_id) between 1 and 128),
  publish_reason text not null check (publish_reason in ('initial', 'update', 'rollback', 'migration')),
  published_at timestamptz not null default clock_timestamp(),
  unique (workspace_id, form_id, version_number),
  unique (workspace_id, form_id, id),
  foreign key (workspace_id, form_id) references forms.forms(workspace_id, id) on delete restrict
);

alter table forms.form_drafts
  add constraint form_drafts_base_version_fk
  foreign key (workspace_id, form_id, based_on_version_id)
  references forms.form_versions(workspace_id, form_id, id)
  deferrable initially deferred;

alter table forms.forms
  add constraint forms_published_version_fk
  foreign key (workspace_id, id, published_version_id)
  references forms.form_versions(workspace_id, form_id, id)
  deferrable initially deferred;

create table forms.form_endpoints (
  id uuid primary key default public.gen_random_uuid(),
  workspace_id uuid not null,
  form_id uuid not null,
  public_id text not null unique check (public_id ~ '^frm_[0-9a-f]{48}$'),
  status text not null default 'active' check (status in ('active', 'retiring', 'retired')),
  rotated_from_id uuid,
  activated_at timestamptz not null default clock_timestamp(),
  retired_at timestamptz,
  accept_until timestamptz,
  created_by_actor_id text not null check (length(created_by_actor_id) between 1 and 128),
  created_at timestamptz not null default clock_timestamp(),
  unique (workspace_id, form_id, id),
  foreign key (workspace_id, form_id) references forms.forms(workspace_id, id) on delete restrict,
  check (retired_at is null or status in ('retiring', 'retired')),
  check (accept_until is null or accept_until >= activated_at)
);

alter table forms.form_endpoints
  add constraint form_endpoints_rotated_from_fk
  foreign key (workspace_id, form_id, rotated_from_id)
  references forms.form_endpoints(workspace_id, form_id, id)
  deferrable initially deferred;

create unique index form_endpoints_one_active_idx
  on forms.form_endpoints(workspace_id, form_id)
  where status = 'active';

create function forms_private.set_definition_hash()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  new.content_hash := public.digest(pg_catalog.convert_to(new.definition::text, 'UTF8'), 'sha256');
  return new;
end
$function$;

create trigger form_drafts_definition_hash
before insert or update of definition on forms.form_drafts
for each row execute function forms_private.set_definition_hash();

create trigger form_versions_definition_hash
before insert on forms.form_versions
for each row execute function forms_private.set_definition_hash();

create function forms_private.reject_immutable_change()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  raise exception using
    errcode = '55000',
    message = format('%I.%I is append-only', tg_table_schema, tg_table_name);
end
$function$;

create trigger form_versions_immutable
before update or delete on forms.form_versions
for each row execute function forms_private.reject_immutable_change();

reset role;
