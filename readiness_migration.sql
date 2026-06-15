-- ============================================================================
-- AI-Readiness Score (E1) — schema, RLS, and atomic lead capture.
--
-- Security model (from /plan-eng-review + /plan-design-review):
--   * All tables have RLS ENABLED with NO policies. The anon / authenticated
--     keys therefore get ZERO access. Only the service_role key (used solely in
--     server actions, never shipped to the browser) bypasses RLS. This keeps
--     student PII unreachable from the client even though the public
--     Supabase URL + anon key are in the bundle.
--   * `public_result_id` is the ONLY identifier that ever appears in a URL or
--     on the share-card. It is opaque and carries no PII.
--   * `capture_token` is a single-use secret returned only to the session that
--     completed the assessment. The capture RPC checks it + flips it used in one
--     transaction, so a shared result link can never attach a stranger's
--     contact info to your score (no lead hijacking).
--   * Consent is stored per-purpose (explicit, never implied) in
--     readiness_consents — DPDP-clean and auditable for resale.
-- Run against the Supabase project (psql or the SQL editor). Idempotent-ish:
-- uses IF NOT EXISTS where practical.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Assessments (no PII) ────────────────────────────────────────────────────
create table if not exists readiness_assessments (
  id              uuid primary key default gen_random_uuid(),
  public_result_id text not null unique,         -- opaque, used in URLs/share-card
  capture_token   uuid not null default gen_random_uuid(), -- single-use owner secret
  capture_used    boolean not null default false,
  answers         jsonb not null,                 -- { questionId: optionIndex }
  score           int  not null,
  band            text not null,
  verdict         text not null,
  percentile      int  not null,
  gaps            jsonb not null,                 -- [{category,label,percent}]
  category_percents jsonb not null,
  score_version   int  not null,
  utm             jsonb,                          -- {source,medium,campaign,referrer}
  created_at      timestamptz not null default now()
);

create index if not exists readiness_assessments_public_id_idx
  on readiness_assessments (public_result_id);

-- ── Leads (PII: phone is required, email optional) ──────────────────────────
create table if not exists readiness_leads (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references readiness_assessments (id) on delete cascade,
  phone_country text not null default '+91',
  phone         text not null,
  email         text,
  created_at    timestamptz not null default now(),
  unique (assessment_id)                          -- one lead per assessment
);

-- ── Consents (per-purpose, explicit) ────────────────────────────────────────
-- purpose ∈ {plan, intel, partner}. granted is always recorded (even false) so
-- we have an auditable record of exactly what the student agreed to.
create table if not exists readiness_consents (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references readiness_leads (id) on delete cascade,
  purpose    text not null,
  granted    boolean not null,
  created_at timestamptz not null default now(),
  unique (lead_id, purpose)
);

-- ── RLS: enabled, deny-all (service_role bypasses) ──────────────────────────
alter table readiness_assessments enable row level security;
alter table readiness_leads        enable row level security;
alter table readiness_consents     enable row level security;
-- Intentionally NO policies. Do not add anon/authenticated policies — the
-- server action with the service-role key is the only sanctioned access path.

-- ── Atomic lead capture ─────────────────────────────────────────────────────
-- Validates the opaque single-use token, writes lead + per-purpose consent, and
-- burns the token — all in one transaction. Returns 'ok' / 'used' / 'notfound'.
-- SECURITY DEFINER so it runs with the function owner's rights; callable only
-- via the service_role key from the server action.
create or replace function readiness_capture_lead(
  p_public_result_id text,
  p_capture_token    uuid,
  p_phone_country    text,
  p_phone            text,
  p_email            text,
  p_consents         jsonb   -- { plan: bool, intel: bool, partner: bool }
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assessment readiness_assessments%rowtype;
  v_lead_id    uuid;
  v_purpose    text;
begin
  select * into v_assessment
  from readiness_assessments
  where public_result_id = p_public_result_id
  for update;

  if not found then
    return 'notfound';
  end if;

  -- Ownership + single-use check. Wrong token or already-captured → refuse,
  -- which is what blocks lead hijacking on a shared result link.
  if v_assessment.capture_used or v_assessment.capture_token <> p_capture_token then
    return 'used';
  end if;

  insert into readiness_leads (assessment_id, phone_country, phone, email)
  values (v_assessment.id, p_phone_country, p_phone, nullif(p_email, ''))
  returning id into v_lead_id;

  for v_purpose in select unnest(array['plan','intel','partner']) loop
    insert into readiness_consents (lead_id, purpose, granted)
    values (v_lead_id, v_purpose, coalesce((p_consents ->> v_purpose)::boolean, false));
  end loop;

  update readiness_assessments
  set capture_used = true
  where id = v_assessment.id;

  return 'ok';
end;
$$;
