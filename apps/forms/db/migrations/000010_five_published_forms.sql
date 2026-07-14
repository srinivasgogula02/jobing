set role jobing_forms_owner;

-- Raise both form gauges together: a workspace may own and publish five forms.
insert into forms.entitlement_limits (workspace_id, metric_key, hard_limit)
select entitlement.workspace_id, metric.metric_key, 5
from forms.workspace_entitlements as entitlement
cross join (values ('forms.total'), ('forms.published')) as metric(metric_key)
where entitlement.plan_key = 'free'
  and entitlement.status in ('active', 'grace')
on conflict (workspace_id, metric_key) do update
set hard_limit = excluded.hard_limit,
    updated_at = clock_timestamp();

update forms.usage_counters as counter
set limit_snapshot = 5,
    updated_at = clock_timestamp()
from forms.workspace_entitlements as entitlement
where entitlement.workspace_id = counter.workspace_id
  and entitlement.plan_key = 'free'
  and entitlement.status in ('active', 'grace')
  and counter.metric_key in ('forms.total', 'forms.published');

reset role;
