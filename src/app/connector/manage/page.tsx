import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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
    <main className="min-h-screen bg-[#0E1219] px-4 py-10 text-[#F2F4F7] sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-[.12em] text-[#8B93A1] hover:text-[#F2F4F7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6F24E]"
        >
          ← Dashboard
        </Link>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[.16em] text-[#C6F24E]">Account security</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em]">Connected AI clients</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-7 text-[#8B93A1]">
          Review which AI apps can create content for your account. Disconnecting a client immediately revokes its access and refresh tokens.
        </p>

        <section className="mt-8 space-y-4" aria-label="Active connector grants">
          {grants.length === 0 ? (
            <div className="rounded-[20px] border border-[#262D3A] bg-[#161B25] p-6 sm:p-8">
              <h2 className="text-xl font-semibold">No active connections</h2>
              <p className="mt-2 leading-7 text-[#8B93A1]">When you connect ChatGPT, Claude, or another MCP client, it will appear here.</p>
            </div>
          ) : grants.map((grant) => (
            <article key={grant.id} className="rounded-[20px] border border-[#262D3A] bg-[#161B25] p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{grant.clientOrigin}</h2>
                  {grant.clientName ? (
                    <p className="mt-2 text-sm text-[#8B93A1]">
                      Client-reported name (unverified): <bdi className="text-[#F2F4F7]">{grant.clientName}</bdi>
                    </p>
                  ) : null}
                  <p className="mt-2 font-mono text-xs text-[#8B93A1]">Connected {formatDate(grant.createdAt)}</p>
                </div>
                <form action={revokeConnectorGrant}>
                  <input type="hidden" name="grant_id" value={grant.id} />
                  <button
                    type="submit"
                    className="min-h-11 rounded-xl border border-[#E8736B]/60 px-4 py-2 text-sm font-semibold text-[#F2F4F7] transition-colors hover:bg-[#E8736B]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6F24E]"
                  >
                    Disconnect
                  </button>
                </form>
              </div>
              <div className="mt-6 border-t border-[#262D3A] pt-5">
                <p className="font-mono text-[11px] uppercase tracking-[.12em] text-[#8B93A1]">Approved permissions</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {grant.scopes.map((scope) => (
                    <li key={scope} className="text-sm text-[#F2F4F7]">• {OAUTH_SCOPE_DETAILS[scope].title}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
