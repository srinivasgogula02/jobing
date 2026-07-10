-- Enables dashboard-managed campaign drafts, pausing, and cancellation.
-- Apply in the Supabase SQL editor before using those lifecycle controls.
alter table public.email_broadcasts
  drop constraint if exists email_broadcasts_status_check;

alter table public.email_broadcasts
  add constraint email_broadcasts_status_check
  check (status in ('draft', 'sending', 'paused', 'completed', 'cancelled', 'failed'));
