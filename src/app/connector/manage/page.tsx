import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PlugZap, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { listOAuthGrants } from "@/lib/oauth";
import { OAUTH_SCOPE_DETAILS } from "@/lib/oauth-scopes";
import { revokeConnectorGrant } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage AI connections | Jobing",
  description: "Review and disconnect AI clients connected to your Jobing account.",
  robots: { index: false, follow: false },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ManageConnectorPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/connector/manage");
  const grants = await listOAuthGrants(userId);

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "AI connector" }]}>
      <div className="min-h-full bg-[#f7f8f4] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">
          <header className="max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[#719500]">AI connections</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.04em] text-[#151914] sm:text-4xl">Apps connected to Jobing AI</h1>
            <p className="mt-3 text-[15px] leading-7 text-[#6e756b]">
              See which AI apps can work in your account. Disconnecting an app immediately removes its access.
            </p>
          </header>

          <section className="mt-7 space-y-3" aria-label="Active connector grants">
            {grants.length === 0 ? (
              <div className="grid min-h-[320px] place-items-center rounded-[4px] border border-dashed border-[#cbd1c6] bg-white p-7 text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-[4px] bg-[#eaf8dc] text-[#4b7000]"><PlugZap size={25} /></span>
                  <h2 className="mt-5 text-xl font-bold text-[#151914]">No AI apps connected</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6e756b]">Connect Jobing AI from ChatGPT, Claude, or another app using your MCP URL. The approved app will appear here.</p>
                </div>
              </div>
            ) : grants.map((grant) => (
              <article key={grant.id} className="rounded-[4px] border border-[#dfe3da] bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[4px] bg-[#eaf8dc] text-[#4b7000]"><ShieldCheck size={20} /></span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-[#151914]">{grant.clientOrigin}</h2>
                      {grant.clientName ? <p className="mt-1 text-sm text-[#6e756b]">Shown by the app as <bdi className="font-semibold text-[#151914]">{grant.clientName}</bdi></p> : null}
                      <p className="mt-2 font-mono text-[11px] text-[#8a9186]">Connected {formatDate(grant.createdAt)}</p>
                    </div>
                  </div>
                  <form action={revokeConnectorGrant}>
                    <input type="hidden" name="grant_id" value={grant.id} />
                    <button type="submit" className="min-h-11 w-full rounded-[4px] border border-[#d8b6b1] px-4 text-sm font-semibold text-[#9a342c] hover:bg-[#fff5f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#719500] sm:w-auto">Disconnect</button>
                  </form>
                </div>
                <div className="mt-5 border-t border-[#e8ebe5] pt-5">
                  <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#7b8277]">What this app can do</p>
                  <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {grant.scopes.map((scope) => <li key={scope} className="flex gap-2 text-sm text-[#4d554b]"><span className="text-[#719500]">✓</span>{OAUTH_SCOPE_DETAILS[scope].title}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
