import { loadDashboard, type ProviderResult, type ToolHealth } from "@/lib/dashboard";

function ProviderNotice<T>({ result, name }: { result: ProviderResult<T>; name: string }) {
  if (result.status === "ok") return null;
  const message = result.reason === "not_configured" ? "Add the read-only API credentials." : result.reason === "timeout" ? "The provider timed out." : result.reason === "rate_limited" ? "The free-tier API limit was reached." : "The provider returned an error.";
  return <div className="providerNotice"><strong>{name} unavailable</strong><span>{message} This panel will retry in two minutes.</span></div>;
}

function total(rows: ToolHealth[], key: "runs" | "success" | "errors") {
  return rows.reduce((sum, row) => sum + row[key], 0);
}

function percentage(value: number, maximum: number) {
  return maximum > 0 ? Math.max(value > 0 ? 4 : 0, Math.round((value / maximum) * 100)) : 0;
}

export default async function DashboardPage() {
  const dashboard = await loadDashboard();
  const eventMap = new Map(dashboard.events.status === "ok" ? dashboard.events.data.map((item) => [item.event, item.count]) : []);
  const toolRows = dashboard.tools.status === "ok" ? dashboard.tools.data : [];
  const runs = total(toolRows, "runs");
  const successes = total(toolRows, "success");
  const successRate = runs ? Math.round((successes / runs) * 100) : 0;
  const activeWeek = dashboard.activeUsers.status === "ok" ? dashboard.activeUsers.data.week : null;
  const cards = [
    { label: "Active connector users", value: activeWeek, detail: "unique users · 7 days" },
    { label: "AI actions completed", value: dashboard.tools.status === "ok" ? successes : null, detail: "successful MCP tools · 7 days" },
    { label: "Tool success rate", value: dashboard.tools.status === "ok" ? successRate : null, suffix: "%", detail: "successes across exact calls" },
    { label: "Form responses", value: dashboard.events.status === "ok" ? eventMap.get("form_submission_completed") ?? 0 : null, detail: "accepted submissions · 7 days" },
  ];
  const activationMaximum = dashboard.activation.status === "ok" ? Math.max(1, ...dashboard.activation.data.map((step) => step.users)) : 1;
  const failureRows = dashboard.failures.status === "ok" ? dashboard.failures.data : [];
  const runtimeRows = dashboard.runtime.status === "ok" ? dashboard.runtime.data : [];
  const clientMix = toolRows.reduce<Record<string, number>>((result, row) => ({ ...result, [row.client]: (result[row.client] ?? 0) + row.runs }), {});
  const areaMix = toolRows.reduce<Record<string, number>>((result, row) => ({ ...result, [row.area]: (result[row.area] ?? 0) + row.runs }), {});

  return <main>
    <header className="topbar">
      <div className="brand"><i className="brandMark" aria-hidden="true">J</i><div><strong>Jobing operations</strong><span>Private product health</span></div></div>
      <div className="freshness"><i /> Updated {new Date(dashboard.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST</div>
    </header>

    <section className="intro">
      <div><p className="eyebrow">Current product · last 7 days</p><h1>Where Jobing creates value, and where it fails.</h1><p>Activation, exact connector tool calls, published work, form responses, payments, missing capabilities, and production failures in one view.</p></div>
      <aside><span>PRIVACY GUARD</span><strong>Measure behavior, not customer content</strong><p>Prompts, page HTML, form answers, names, emails, URLs, and resource IDs never enter product analytics. Signed-in replays mask all text and inputs.</p></aside>
    </section>

    <section className="metricRail" aria-label="Product overview">
      {cards.map((card) => <article key={card.label}><span>{card.label}</span><strong>{card.value === null ? "—" : `${card.value.toLocaleString("en-IN")}${card.suffix ?? ""}`}</strong><small>{card.detail}</small></article>)}
    </section>
    <ProviderNotice result={dashboard.events} name="PostHog" />

    <section className="panel activationPanel">
      <div className="panelHeading"><div><p className="eyebrow">Activation</p><h2>From account to completed work</h2></div><span>Unique users · 30 days</span></div>
      <ProviderNotice result={dashboard.activation} name="PostHog" />
      {dashboard.activation.status === "ok" && <div className="activationSteps">
        {dashboard.activation.data.map((step) => <article key={step.event}>
          <div><span>{step.label}</span><strong>{step.users.toLocaleString("en-IN")}</strong></div>
          <i aria-hidden="true"><b style={{ width: `${percentage(step.users, activationMaximum)}%` }} /></i>
        </article>)}
      </div>}
    </section>

    <div className="dashboardGrid primaryGrid">
      <section className="panel toolsPanel">
        <div className="panelHeading"><div><p className="eyebrow">Connector health</p><h2>What each AI client is doing</h2></div><span>Exact tool calls · 7 days</span></div>
        <ProviderNotice result={dashboard.tools} name="PostHog" />
        {dashboard.tools.status === "ok" && (toolRows.length ? <div className="toolTable">
          <div className="tableHead"><span>Tool and client</span><span>Success</span><span>Runs</span><span>Average</span></div>
          {toolRows.map((row) => <div className="tableRow" key={`${row.tool}:${row.area}:${row.client}`}>
            <div><strong>{row.tool.replaceAll("_", " ")}</strong><small>{row.area} · {row.client}</small></div>
            <span className={`healthRate ${row.success === row.runs ? "healthy" : row.success === 0 ? "failed" : "mixed"}`}>{row.runs ? Math.round((row.success / row.runs) * 100) : 0}%</span>
            <b>{row.runs.toLocaleString("en-IN")}</b>
            <time>{row.avgDurationMs < 1_000 ? `${row.avgDurationMs}ms` : `${(row.avgDurationMs / 1_000).toFixed(1)}s`}</time>
          </div>)}
        </div> : <div className="empty"><strong>No current tool telemetry yet</strong><span>Complete one connector action after this release. Its tool, AI client, area, result, and latency will appear here.</span></div>)}
      </section>

      <aside className="signalStack">
        <section className="panel mixPanel">
          <div className="panelHeading"><div><p className="eyebrow">Usage mix</p><h2>Who calls what</h2></div></div>
          <div className="mixGroups">
            <div><span>AI client</span>{Object.entries(clientMix).sort((a, b) => b[1] - a[1]).map(([label, count]) => <p key={label}><b>{label}</b><strong>{count}</strong></p>)}</div>
            <div><span>Product area</span>{Object.entries(areaMix).sort((a, b) => b[1] - a[1]).map(([label, count]) => <p key={label}><b>{label}</b><strong>{count}</strong></p>)}</div>
          </div>
        </section>

        <section className="panel failurePanel">
          <div className="panelHeading"><div><p className="eyebrow">Friction</p><h2>Tool failures</h2></div><span>7 days</span></div>
          <ProviderNotice result={dashboard.failures} name="PostHog" />
          {dashboard.failures.status === "ok" && (failureRows.length ? <div className="failureList">{failureRows.map((row) => <div key={`${row.tool}:${row.code}`}><p><strong>{row.code.replaceAll("_", " ")}</strong><span>{row.tool.replaceAll("_", " ")}</span></p><b>{row.count}</b></div>)}</div> : <div className="empty good"><strong>No classified tool failures</strong><span>All tracked connector calls completed successfully.</span></div>)}
        </section>
      </aside>
    </div>

    <div className="dashboardGrid healthGrid">
      <section className="panel runtimePanel">
        <div className="panelHeading"><div><p className="eyebrow">Public runtime</p><h2>Pages and form delivery</h2></div><span>7 days</span></div>
        <ProviderNotice result={dashboard.runtime} name="PostHog" />
        {dashboard.runtime.status === "ok" && (runtimeRows.length ? <div className="runtimeList">{runtimeRows.map((row) => <div key={`${row.event}:${row.outcome}:${row.reason}`}><div><strong>{row.event === "form_submission_completed" ? "Form submission" : "Generated page"}</strong><span>{row.reason.replaceAll("_", " ")}</span></div><em className={row.outcome}>{row.outcome}</em><b>{row.count}</b></div>)}</div> : <div className="empty"><strong>No runtime requests yet</strong><span>Page views and form submissions will appear here without their content.</span></div>)}
      </section>

      <section className="panel reliabilityPanel">
        <div className="panelHeading"><div><p className="eyebrow">Reliability</p><h2>Open production failures</h2></div><span>Sentry · 14 days</span></div>
        <ProviderNotice result={dashboard.issues} name="Sentry" />
        {dashboard.issues.status === "ok" && (dashboard.issues.data.length ? <div className="issueList">{dashboard.issues.data.map((issue) => <a href={issue.permalink} target="_blank" rel="noreferrer" key={issue.id}><div><strong>{issue.title}</strong><span>{issue.count} events · {issue.users} affected</span></div><time>{new Date(issue.lastSeen).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time></a>)}</div> : <div className="empty good"><strong>No unresolved issues</strong><span>Sentry has no open production failures in the last 14 days.</span></div>)}
      </section>
    </div>

    <section className="panel feedbackPanel">
      <div className="panelHeading"><div><p className="eyebrow">Product signal</p><h2>What users explicitly need next</h2></div><span>Confirmed through the connector</span></div>
      <ProviderNotice result={dashboard.feedback} name="Supabase feedback" />
      {dashboard.feedback.status === "ok" && (dashboard.feedback.data.length ? <div className="feedbackList">{dashboard.feedback.data.map((item) => <article key={item.id}><div><span>{item.kind.replaceAll("_", " ")} · {item.status.replaceAll("_", " ")}</span><time>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time></div><strong>{item.summary}</strong><p>{[item.useCase, item.blockedTool].filter(Boolean).map((value) => value?.replaceAll("_", " ")).join(" · ") || "No extra classification"}</p></article>)}</div> : <div className="empty"><strong>No confirmed feedback yet</strong><span>When a user asks the AI connector to report friction or a missing capability, it appears here.</span></div>)}
    </section>

    <footer><span>Jobing AI · operations surface</span><span>Provider failures show as unavailable, never as zero.</span></footer>
  </main>;
}
