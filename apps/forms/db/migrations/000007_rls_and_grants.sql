set role jobing_forms_owner;

-- Phase 1 uses one server-only DATABASE_URL for dashboard reads and signed
-- internal mutations. Its SQL-created LOGIN role must inherit both group roles:
--   grant jobing_forms_control, jobing_forms_sync to <runtime_login>;
-- Do not grant jobing_forms_owner, worker, auditor, public, or ingest to it.

do $rls$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'forms.workspaces',
    'forms.workspace_memberships',
    'forms.usage_metrics',
    'forms.workspace_entitlements',
    'forms.entitlement_limits',
    'forms.usage_counters',
    'forms.usage_ledger',
    'forms.projects',
    'forms.forms',
    'forms.form_drafts',
    'forms.form_versions',
    'forms.form_endpoints',
    'forms_private.request_nonces',
    'forms_private.idempotency_records',
    'forms_private.inbox_events',
    'forms_private.outbox_events',
    'forms_audit.events'
  ] loop
    execute format('alter table %s enable row level security', relation_name);
    execute format('alter table %s force row level security', relation_name);
    execute format(
      'create policy owner_full_access on %s for all to jobing_forms_owner using (true) with check (true)',
      relation_name
    );
    execute format('revoke all on %s from public', relation_name);
    execute format(
      'revoke all on %s from jobing_forms_control, jobing_forms_sync, jobing_forms_public, jobing_forms_ingest, jobing_forms_worker, jobing_forms_auditor',
      relation_name
    );
  end loop;
end
$rls$;

create policy auditor_read_only
on forms_audit.events
for select
to jobing_forms_auditor
using (true);

-- Normalize existing function ACLs before granting the exact Phase 1 surface.
-- This is required even with the bootstrap default ACL because PostgreSQL
-- otherwise gives PUBLIC EXECUTE on newly created functions.
revoke execute on all functions in schema forms, forms_private, forms_audit, forms_api
  from public, jobing_forms_control, jobing_forms_sync, jobing_forms_public,
       jobing_forms_ingest, jobing_forms_worker, jobing_forms_auditor;

grant usage on schema forms_api to jobing_forms_control, jobing_forms_sync, jobing_forms_worker;
grant usage on schema forms_audit to jobing_forms_auditor;

grant execute on function forms_api.claim_request_nonce(text, text, timestamptz)
  to jobing_forms_control, jobing_forms_sync;
grant execute on function forms_api.list_forms(text)
  to jobing_forms_control;
grant execute on function forms_api.create_form_draft(text, text, uuid, text, text, text, text, jsonb)
  to jobing_forms_control;
grant execute on function forms_api.publish_form(text, uuid, bigint, text, text, text, uuid)
  to jobing_forms_control;
grant execute on function forms_api.apply_workspace_projection(text, text, jsonb, jsonb, jsonb, text)
  to jobing_forms_sync;

grant execute on function forms_api.claim_outbox(text, integer, integer)
  to jobing_forms_worker;
grant execute on function forms_api.ack_outbox(text, uuid)
  to jobing_forms_worker;
grant execute on function forms_api.retry_outbox(text, uuid, text, text, integer, boolean)
  to jobing_forms_worker;

grant select on forms_audit.events to jobing_forms_auditor;

reset role;
