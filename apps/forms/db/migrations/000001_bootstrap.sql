-- Jobing Forms database bootstrap. Runtime credentials are members of these
-- NOLOGIN group roles. Create the least-privilege LOGIN role with SQL, not the
-- Neon Console/API (those managed roles inherit neon_superuser), then grant it
-- BOTH jobing_forms_control and jobing_forms_sync. DATABASE_MIGRATION_URL uses
-- the direct Neon owner credential and is the only login allowed to SET ROLE
-- jobing_forms_owner. Passwords never belong in migrations.
create extension if not exists pgcrypto;

do $roles$
declare
  role_name text;
begin
  foreach role_name in array array[
    'jobing_forms_owner',
    'jobing_forms_control',
    'jobing_forms_sync',
    'jobing_forms_public',
    'jobing_forms_ingest',
    'jobing_forms_worker',
    'jobing_forms_auditor'
  ] loop
    if not exists (select 1 from pg_catalog.pg_roles where rolname = role_name) then
      execute format(
        'create role %I nologin nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls',
        role_name
      );
    end if;
  end loop;

  -- The Neon migration role may SET ROLE to the non-login object owner. Runtime
  -- roles are never granted this membership.
  execute format('grant jobing_forms_owner to %I', current_user);
end
$roles$;

create schema if not exists forms authorization jobing_forms_owner;
create schema if not exists forms_private authorization jobing_forms_owner;
create schema if not exists forms_audit authorization jobing_forms_owner;
create schema if not exists forms_api authorization jobing_forms_owner;

revoke create on schema public from public;
revoke all on schema forms, forms_private, forms_audit, forms_api from public;

set role jobing_forms_owner;

-- PostgreSQL's built-in function default grants EXECUTE to PUBLIC globally.
-- A schema-scoped default ACL can add privileges but cannot subtract that
-- global default, so this revoke must deliberately be role-global.
alter default privileges revoke execute on functions from public;

alter default privileges in schema forms revoke all on tables from public;
alter default privileges in schema forms revoke all on sequences from public;

alter default privileges in schema forms_private revoke all on tables from public;
alter default privileges in schema forms_private revoke all on sequences from public;

alter default privileges in schema forms_audit revoke all on tables from public;
alter default privileges in schema forms_audit revoke all on sequences from public;

reset role;
