import { loadDashboard, type ProviderResult } from "@/lib/dashboard";

function ProviderNotice<T>({ result, name }: { result: ProviderResult<T>; name: string }) {
  if (result.status === "ok") return null;
  const message = result.reason === "not_configured" ? "Add the read-only API credentials." : result.reason === "timeout" ? "The provider timed out." : result.reason === "rate_limited" ? "The free-tier API limit was reached." : "The provider returned an error.";
  return <div className="providerNotice"><strong>{name} unavailable</strong><span>{message} This panel will retry in 60 seconds.</span></div>;
}

export default async function DashboardPage() {
  const dashboard = await loadDashboard();
  const eventMap = new Map(dashboard.events.status === "ok" ? dashboard.events.data.map((item) => [item.event, item.count]) : []);
  const toolRows = dashboard.tools.status === "ok" ? dashboard.tools.data : [];
  const cards = [
    { label: "MCP requests", value: dashboard.events.status === "ok" ? eventMap.get("mcp_request_completed") ?? 0 : null },
    { label: "Tools completed", value: dashboard.tools.status === "ok" ? toolRows.filter((row) => row.outcome === "success").reduce((sum, row) => sum + row.count, 0) : null },
    { label: "Pages published", value: dashboard.tools.status === "ok" ? toolRows.filter((row) => row.tool === "deploy_page" && row.outcome === "success").reduce((sum, row) => sum + row.count, 0) : null },
    { label: "Responses received", value: dashboard.events.status === "ok" ? eventMap.get("form_submission_completed") ?? 0 : null },
  ];
  return <main>
    <header className="topbar">
      <div className="brand"><i className="brandMark" aria-hidden="true">J</i><div><strong>Jobing operations</strong><span>Private product health</span></div></div>
      <div className="freshness"><i /> Updated {new Date(dashboard.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST</div>
    </header>

    <section className="intro">
      <div><p className="eyebrow">Last 7 days</p><h1>Is Jobing finishing the work?</h1><p>One view of connector usage, completed customer outcomes, missing capabilities, and failures that need attention.</p></div>
      <aside><span>FREE-TIER MODE</span><strong>Explicit events only</strong><p>No replay, prompts, HTML, form answers, names, or email addresses.</p></aside>
    </section>

    <section className="metricRail" aria-label="Product overview">
      {cards.map((card) => <article key={card.label}><span>{card.label}</span><strong>{card.value === null ? "—" : card.value.toLocaleString("en-IN")}</strong><small>completed operations</small></article>)}
    </section>
    <ProviderNotice result={dashboard.events} name="PostHog" />

    <div className="dashboardGrid">
      <section className="panel toolsPanel">
        <div className="panelHeading"><div><p className="eyebrow">Connector</p><h2>What the AI is doing</h2></div><span>7 days</span></div>
        <ProviderNotice result={dashboard.tools} name="PostHog" />
        {dashboard.tools.status === "ok" && (dashboard.tools.data.length ? <div className="toolTable">
          <div className="tableHead"><span>Tool</span><span>Outcome</span><span>Runs</span></div>
          {dashboard.tools.data.map((row) => <div className="tableRow" key={`${row.tool}:${row.outcome}`}><strong>{row.tool.replaceAll("_", " ")}</strong><span className={`outcome ${row.outcome}`}>{row.outcome}</span><b>{row.count.toLocaleString("en-IN")}</b></div>)}
        </div> : <div className="empty"><strong>No tool events yet</strong><span>Connect Jobing AI and complete a tool call. The first event will appear here.</span></div>)}
      </section>

      <section className="panel reliabilityPanel">
        <div className="panelHeading"><div><p className="eyebrow">Reliability</p><h2>Open failures</h2></div><span>Sentry</span></div>
        <ProviderNotice result={dashboard.issues} name="Sentry" />
        {dashboard.issues.status === "ok" && (dashboard.issues.data.length ? <div className="issueList">{dashboard.issues.data.map((issue) => <a href={issue.permalink} target="_blank" rel="noreferrer" key={issue.id}><div><strong>{issue.title}</strong><span>{issue.count} events · {issue.users} affected</span></div><time>{new Date(issue.lastSeen).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time></a>)}</div> : <div className="empty good"><strong>No unresolved issues</strong><span>Sentry has no open production failures in the last 7 days.</span></div>)}
      </section>
    </div>

    <section className="panel feedbackPanel">
      <div className="panelHeading"><div><p className="eyebrow">Product signal</p><h2>What users need next</h2></div><span>Explicitly confirmed feedback</span></div>
      <ProviderNotice result={dashboard.feedback} name="Supabase feedback" />
      {dashboard.feedback.status === "ok" && (dashboard.feedback.data.length ? <div className="feedbackList">{dashboard.feedback.data.map((item) => <article key={item.id}><div><span>{item.kind.replaceAll("_", " ")} · {item.status.replaceAll("_", " ")}</span><time>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time></div><strong>{item.summary}</strong><p>{[item.useCase, item.blockedTool].filter(Boolean).map((value) => value?.replaceAll("_", " ")).join(" · ") || "No extra classification"}</p></article>)}</div> : <div className="empty"><strong>No confirmed feedback yet</strong><span>When a user asks the connector to report a problem or missing capability, it appears here.</span></div>)}
    </section>

    <footer><span>Jobing AI · operations surface</span><span>Provider failures show as unavailable, never as zero.</span></footer>
  </main>;
}
