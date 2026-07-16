-- Authorize an MCP request and consume its distributed grant limit in one
-- database round trip. Token revocation, expiry, issuer/resource validation,
-- live-user validation, and throttling remain fail-closed and transactional.

begin;

create index if not exists oauth_rate_limit_buckets_updated_idx
  on public.oauth_rate_limit_buckets(updated_at);

create or replace function public.oauth_authorize_mcp_request(
  p_access_token_hash text,
  p_resource text,
  p_issuer text,
  p_limit integer default 120,
  p_window_seconds integer default 60
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_token jsonb;
  v_allowed boolean;
  v_redirect_uris text[];
begin
  v_token := public.oauth_validate_access_token(
    p_access_token_hash,
    p_resource,
    p_issuer
  );
  if v_token is null then
    return null;
  end if;

  v_allowed := public.oauth_consume_rate_limit(
    (v_token->>'grant_id')::uuid,
    'mcp',
    p_limit,
    p_window_seconds
  );

  select client.redirect_uris
  into v_redirect_uris
  from public.oauth_clients as client
  where client.client_id = v_token->>'client_id'
    and client.issuer = p_issuer;

  return v_token || jsonb_build_object(
    'rate_limit_allowed', coalesce(v_allowed, false),
    'redirect_uris', coalesce(to_jsonb(v_redirect_uris), '[]'::jsonb)
  );
end
$$;

revoke all on function public.oauth_authorize_mcp_request(text, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.oauth_authorize_mcp_request(text, text, text, integer, integer) to service_role;

commit;
