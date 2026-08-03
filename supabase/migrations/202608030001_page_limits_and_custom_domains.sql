-- Page quotas and custom domains for the main Jobing Supabase database.
-- All mutations are server-only through service_role. The public runtime gets
-- one narrow resolver that returns only published HTML and its update time.

create extension if not exists pgcrypto;

create table if not exists public.page_domains (
  id uuid primary key default gen_random_uuid(),
  user_id text not null check (length(user_id) between 1 and 128),
  hostname text not null,
  status text not null default 'provisioning'
    check (status in ('provisioning', 'pending', 'verified', 'error')),
  is_default boolean not null default false,
  verification jsonb not null default '[]'::jsonb,
  dns_records jsonb not null default '[]'::jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  last_checked_at timestamptz,
  constraint page_domains_hostname_normalized check (
    hostname = lower(hostname)
    and hostname !~ '[/:]'
    and length(hostname) between 4 and 253
  )
);

create unique index if not exists page_domains_hostname_unique
  on public.page_domains (hostname);
create index if not exists page_domains_user_created_idx
  on public.page_domains (user_id, created_at);
create unique index if not exists page_domains_one_default_per_user
  on public.page_domains (user_id) where is_default;

alter table public.page_domains enable row level security;
revoke all on public.page_domains from public, anon, authenticated;
grant all on public.page_domains to service_role;

alter table public.pages
  add column if not exists custom_domain_id uuid,
  add column if not exists custom_path text;

update public.pages set custom_path = id where custom_path is null;

alter table public.pages
  alter column custom_path set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pages_custom_domain_fk'
      and conrelid = 'public.pages'::regclass
  ) then
    alter table public.pages
      add constraint pages_custom_domain_fk
      foreign key (custom_domain_id) references public.page_domains(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pages_custom_path_format'
      and conrelid = 'public.pages'::regclass
  ) then
    alter table public.pages
      add constraint pages_custom_path_format check (
        custom_path ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'
      );
  end if;
end
$$;

create unique index if not exists pages_domain_path_unique
  on public.pages (custom_domain_id, custom_path)
  where custom_domain_id is not null;
create index if not exists pages_owner_updated_idx
  on public.pages (user_id, updated_at desc);

create or replace function public.jobing_create_page(
  p_user_id text,
  p_page_id text,
  p_html text,
  p_page_limit integer
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_existing public.pages%rowtype;
  v_count integer;
  v_domain_id uuid;
begin
  if p_user_id is null or length(p_user_id) = 0 then
    raise exception 'invalid_user';
  end if;
  if p_page_limit < 0 or p_page_limit > 100000 then
    raise exception 'invalid_page_limit';
  end if;
  if p_page_id !~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$' then
    raise exception 'invalid_page_id';
  end if;
  if p_html is null or length(p_html) = 0 or length(p_html) > 500000 then
    raise exception 'invalid_page_html';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('jobing-pages:' || p_user_id, 0));

  select * into v_existing from public.pages where id = p_page_id;
  if found then
    if v_existing.user_id = p_user_id and v_existing.html_content = p_html then
      select count(*)::integer into v_count from public.pages where user_id = p_user_id;
      return jsonb_build_object('status', 'idempotent', 'count', v_count, 'id', p_page_id);
    end if;
    return jsonb_build_object('status', 'page_id_taken');
  end if;

  select count(*)::integer into v_count from public.pages where user_id = p_user_id;
  if v_count >= p_page_limit then
    return jsonb_build_object('status', 'limit_reached', 'count', v_count, 'limit', p_page_limit);
  end if;

  select id into v_domain_id
  from public.page_domains
  where user_id = p_user_id and is_default
  order by created_at asc
  limit 1;

  insert into public.pages (
    id, html_content, user_id, custom_domain_id, custom_path, created_at, updated_at
  ) values (
    p_page_id, p_html, p_user_id, v_domain_id, p_page_id, now(), now()
  );

  return jsonb_build_object('status', 'created', 'count', v_count + 1, 'limit', p_page_limit, 'id', p_page_id);
exception
  when unique_violation then
    return jsonb_build_object('status', 'page_id_taken');
end
$$;

create or replace function public.jobing_reserve_page_domain(
  p_user_id text,
  p_hostname text,
  p_domain_limit integer
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_existing public.page_domains%rowtype;
  v_count integer;
  v_id uuid;
  v_default boolean;
begin
  if p_user_id is null or length(p_user_id) = 0 then
    raise exception 'invalid_user';
  end if;
  if p_domain_limit < 0 or p_domain_limit > 1000 then
    raise exception 'invalid_domain_limit';
  end if;
  if p_hostname is null
     or p_hostname <> lower(p_hostname)
     or length(p_hostname) not between 4 and 253
     or p_hostname !~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$' then
    raise exception 'invalid_hostname';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('jobing-page-domains:' || p_user_id, 0));

  select * into v_existing from public.page_domains where hostname = p_hostname;
  if found then
    if v_existing.user_id = p_user_id then
      return jsonb_build_object(
        'status', 'existing', 'id', v_existing.id, 'domainStatus', v_existing.status
      );
    end if;
    return jsonb_build_object('status', 'domain_taken');
  end if;

  select count(*)::integer into v_count from public.page_domains where user_id = p_user_id;
  if v_count >= p_domain_limit then
    return jsonb_build_object('status', 'limit_reached', 'count', v_count, 'limit', p_domain_limit);
  end if;

  v_default := v_count = 0;
  insert into public.page_domains (user_id, hostname, is_default)
  values (p_user_id, p_hostname, v_default)
  returning id into v_id;

  if v_default then
    update public.pages
    set custom_domain_id = v_id,
        custom_path = id,
        updated_at = now()
    where user_id = p_user_id and custom_domain_id is null;
  end if;

  return jsonb_build_object(
    'status', 'reserved', 'id', v_id, 'count', v_count + 1,
    'limit', p_domain_limit, 'isDefault', v_default
  );
exception
  when unique_violation then
    return jsonb_build_object('status', 'domain_taken');
end
$$;

create or replace function public.jobing_rename_page(
  p_user_id text,
  p_old_id text,
  p_new_id text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_page public.pages%rowtype;
begin
  if p_old_id !~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'
     or p_new_id !~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$' then
    raise exception 'invalid_page_id';
  end if;

  select * into v_page
  from public.pages
  where id = p_old_id and user_id = p_user_id
  for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  if exists (select 1 from public.pages where id = p_new_id) then
    return jsonb_build_object('status', 'page_id_taken');
  end if;

  update public.pages
  set id = p_new_id,
      custom_path = case when custom_path = p_old_id then p_new_id else custom_path end,
      updated_at = now()
  where id = p_old_id and user_id = p_user_id;
  return jsonb_build_object('status', 'renamed', 'id', p_new_id);
exception
  when unique_violation then
    return jsonb_build_object('status', 'page_id_taken');
end
$$;

create or replace function public.resolve_custom_page(
  p_hostname text,
  p_path text
) returns table (html_content text, updated_at timestamptz)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select p.html_content, p.updated_at
  from public.page_domains d
  join public.pages p on p.custom_domain_id = d.id
  where d.hostname = lower(p_hostname)
    and d.status = 'verified'
    and p.custom_path = lower(p_path)
  limit 1
$$;

revoke all on function public.jobing_create_page(text, text, text, integer) from public, anon, authenticated;
revoke all on function public.jobing_reserve_page_domain(text, text, integer) from public, anon, authenticated;
revoke all on function public.jobing_rename_page(text, text, text) from public, anon, authenticated;
grant execute on function public.jobing_create_page(text, text, text, integer) to service_role;
grant execute on function public.jobing_reserve_page_domain(text, text, integer) to service_role;
grant execute on function public.jobing_rename_page(text, text, text) to service_role;

revoke all on function public.resolve_custom_page(text, text) from public;
grant execute on function public.resolve_custom_page(text, text) to anon, authenticated, service_role;
