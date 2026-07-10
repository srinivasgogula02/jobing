-- Account ownership for notes created through MCP and future connected tools.
alter table public.copies
  add column if not exists user_id text references public.users(id) on delete set null;

create index if not exists copies_user_id_idx on public.copies(user_id);

-- OAuth 2.0 support for the hosted MCP server (ChatGPT custom connector).
--
-- ChatGPT connects to remote MCP servers from Anthropic's cloud and will NOT
-- let a user paste a static bearer header. Authenticated connectors must speak
-- OAuth 2.0 (Dynamic Client Registration + PKCE). These tables back that flow.
--
-- user_id is TEXT (a Clerk user id, e.g. "user_2ab...") to match every other
-- table after the Clerk migration. No FK -- the id is Clerk-owned, not a
-- profiles row, and the MCP dispatch() layer only needs the string.
--
-- Run manually (this repo hand-runs .sql migrations):
--   psql "$DATABASE_URL" -f oauth_mcp.sql

-- 1. Registered OAuth clients (one row per Dynamic Client Registration call).
create table if not exists public.oauth_clients (
  client_id text primary key,
  -- Public clients (ChatGPT via DCR/PKCE) have no secret -> hash stays null.
  client_secret_hash text,
  redirect_uris text[] not null default '{}',
  client_name text,
  token_endpoint_auth_method text not null default 'none',
  created_at timestamptz not null default now()
);

-- 2. Short-lived authorization codes (single use, ~5 min TTL).
create table if not exists public.oauth_auth_codes (
  code_hash text primary key,
  client_id text not null,
  user_id text not null,
  redirect_uri text not null,
  scope text not null default 'mcp',
  -- PKCE (RFC 7636) -- S256 only.
  code_challenge text not null,
  code_challenge_method text not null default 'S256',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- 3. Access + refresh tokens. Tokens are stored hashed (sha256), never raw,
--    exactly like api_keys. One row per issued access token; refresh rotation
--    revokes the old row and inserts a new one.
create table if not exists public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  access_token_hash text not null,
  refresh_token_hash text,
  client_id text not null,
  user_id text not null,
  scope text not null default 'mcp',
  access_expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  is_revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_oauth_tokens_access on public.oauth_tokens(access_token_hash) where is_revoked = false;
create index if not exists idx_oauth_tokens_refresh on public.oauth_tokens(refresh_token_hash) where is_revoked = false;
create index if not exists idx_oauth_tokens_user on public.oauth_tokens(user_id);
create index if not exists idx_oauth_auth_codes_expires on public.oauth_auth_codes(expires_at);

-- These tables are only ever touched by the server via the Supabase service
-- role (which bypasses RLS), never from the browser. Enable RLS with no public
-- policies so a leaked anon key can't read tokens.
alter table public.oauth_clients enable row level security;
alter table public.oauth_auth_codes enable row level security;
alter table public.oauth_tokens enable row level security;
