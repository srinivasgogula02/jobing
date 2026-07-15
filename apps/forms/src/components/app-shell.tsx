"use client";

import { UserButton } from "@clerk/nextjs";
import {
  CreditCard,
  FormInput,
  Globe2,
  LayoutDashboard,
  Menu,
  PlugZap,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, local: false },
  { label: "Pages", path: "/dashboard/pages", icon: Globe2, local: false },
  { label: "Forms", path: "/forms/app", icon: FormInput, local: true },
  { label: "AI connector", path: "/connector/manage", icon: PlugZap, local: false },
  { label: "Billing", path: "/billing", icon: CreditCard, local: false },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainSite = process.env.NEXT_PUBLIC_JOBING_SITE_URL || "https://jobing.site";

  const navigationLinks = navigation.map(({ label, path, icon: Icon, local }) => {
    const className = `workspace-nav-link${label === "Forms" ? " workspace-nav-link--active" : ""}`;
    const content = <><Icon size={17} aria-hidden="true" /><span>{label}</span></>;
    return local
      ? <Link key={label} className={className} href="/app" onClick={() => setMobileOpen(false)} aria-current="page">{content}</Link>
      : <a key={label} className={className} href={`${mainSite}${path}`} onClick={() => setMobileOpen(false)}>{content}</a>;
  });

  return (
    <div className="workspace-shell">
      <aside className={`workspace-sidebar${mobileOpen ? " workspace-sidebar--open" : ""}`} aria-label="Jobing workspace">
        <div className="workspace-sidebar-head">
          <a className="workspace-brand" href={`${mainSite}/dashboard`} aria-label="Jobing AI dashboard">
            <Image src="/forms/logo.png" alt="" width={28} height={28} priority />
            <strong>Jobing AI</strong>
          </a>
          <button className="workspace-close" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={19} /></button>
        </div>
        <nav className="workspace-nav" aria-label="Workspace navigation">{navigationLinks}</nav>
        <div className="workspace-sidebar-foot"><span>JOBING FORMS</span><p>Create forms, collect responses, and ask your AI what they mean.</p></div>
      </aside>

      {mobileOpen ? <button className="workspace-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /> : null}

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar-left">
            <button className="workspace-menu" type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <Link className="workspace-topbar-brand" href="/app">
              <Image src="/forms/logo.png" alt="" width={27} height={27} priority />
              <strong>Jobing AI</strong><span>/</span><b>Forms</b>
            </Link>
          </div>
          <UserButton appearance={{ elements: { avatarBox: "workspace-avatar" } }} />
        </header>
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
