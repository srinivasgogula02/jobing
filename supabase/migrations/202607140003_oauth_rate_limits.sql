-- Distributed per-grant connector throttling for serverless deployments.

begin;

create table if not exists public.oauth_rate_limit_buckets (
  grant_id          uuid not null references public.oauth_grants(id) on delete cascade,
  bucket_key        text not null check (bucket_key ~ '^[a-z][a-z0-9_.-]{0,63}$'),
  window_started_at timestamptz not null,
  request_count     integer not null check (request_count > 0),
  updated_at        timestamptz not null default clock_timestamp(),
  primary key (grant_id, bucket_key)
);

alter table public.oauth_rate_limit_buckets enable row level security;

create or replace function public.oauth_consume_rate_limit(
  p_grant_id uuid,
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_allowed boolean;
begin
  if p_bucket_key !~ '^[a-z][a-z0-9_.-]{0,63}$'
     or p_limit not between 1 and 10000
     or p_window_seconds not between 1 and 86400 then
    return false;
  end if;

  if not exists (
    select 1 from public.oauth_grants
    where id = p_grant_id and revoked_at is null
  ) then
    return false;
  end if;

  insert into public.oauth_rate_limit_buckets (
    grant_id, bucket_key, window_started_at, request_count, updated_at
  ) values (
    p_grant_id, p_bucket_key, v_now, 1, v_now
  )
  on conflict (grant_id, bucket_key) do update
  set window_started_at = case
        when public.oauth_rate_limit_buckets.window_started_at
          <= v_now - make_interval(secs => p_window_seconds)
        then v_now
        else public.oauth_rate_limit_buckets.window_started_at
      end,
      request_count = case
        when public.oauth_rate_limit_buckets.window_started_at
          <= v_now - make_interval(secs => p_window_seconds)
        then 1
        else public.oauth_rate_limit_buckets.request_count + 1
      end,
      updated_at = v_now
  returning request_count <= p_limit into v_allowed;

  -- Bounded opportunistic cleanup keeps revoked/old grant buckets from
  -- accumulating if cascade cleanup was delayed during an incident.
  delete from public.oauth_rate_limit_buckets
  where ctid in (
    select ctid
    from public.oauth_rate_limit_buckets
    where updated_at < v_now - interval '2 days'
    limit 100
  );

  return coalesce(v_allowed, false);
end
$$;

revoke all on table public.oauth_rate_limit_buckets from public, anon, authenticated;
revoke all on function public.oauth_consume_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.oauth_consume_rate_limit(uuid, text, integer, integer) to service_role;

commit;
