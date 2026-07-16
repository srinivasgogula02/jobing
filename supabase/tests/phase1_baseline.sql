-- Minimal pre-Phase-1 fixture used only by CI to exercise connector_migration.sql
-- and the additive Supabase migrations on stock PostgreSQL. Install pgcrypto
-- in the same schema Supabase uses so schema-qualified mistakes fail in CI.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated', 'service_role'] loop
    if not exists (select 1 from pg_roles where rolname = role_name) then
      execute format('create role %I nologin', role_name);
    end if;
  end loop;
end
$$;

create table public.users (
  id text primary key
);

create table public.copies (
  id text primary key
);
