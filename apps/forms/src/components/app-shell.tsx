import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function AppShell({ children, current = "forms" }: { children: React.ReactNode; current?: "forms" }) {
  const mainSite = process.env.NEXT_PUBLIC_JOBING_SITE_URL || "https://jobing.site";
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <a className="brand" href={`${mainSite}/dashboard`} aria-label="Jobing AI dashboard">
          <span className="brand__mark" aria-hidden="true">J</span>
          <span className="brand__jobing">Jobing</span>
          <span className="brand__product">Forms</span>
        </a>
        <nav className="app-nav" aria-label="Forms navigation">
          <a href={`${mainSite}/dashboard`}>Dashboard</a>
          <Link href="/app" aria-current={current === "forms" ? "page" : undefined}>Forms</Link>
        </nav>
        <div className="sidebar-note">
          <span>Need the connector?</span>
          <a href={`${mainSite}/dashboard`}>Copy the MCP URL</a>
        </div>
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <Link href="/app" className="mobile-brand">Jobing Forms</Link>
          <UserButton />
        </header>
        {children}
      </main>
    </div>
  );
}
