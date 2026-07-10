import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getClient } from "@/lib/oauth";
import { approveAuthorization, denyAuthorization } from "./actions";

export const dynamic = "force-dynamic";

type Params = { response_type?: string; client_id?: string; redirect_uri?: string; state?: string; code_challenge?: string; code_challenge_method?: string };

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/oauth/authorize?${new URLSearchParams(p as Record<string,string>)}`)}`);
  const client = await getClient(p.client_id || "");
  if (p.response_type !== "code" || !client || !client.redirect_uris.includes(p.redirect_uri || "") || !p.code_challenge || p.code_challenge_method !== "S256") {
    return <main className="min-h-screen grid place-items-center p-6"><p>Invalid connector authorization request.</p></main>;
  }
  const user = await currentUser();
  const account = user?.primaryEmailAddress?.emailAddress || "your Jobing account";
  return <main className="min-h-screen bg-[#fafafa] grid place-items-center p-5"><section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-black">Connect to Jobing</h1>
    <p className="mt-3 text-sm text-[#6b7280]">{client.client_name || "ChatGPT"} wants access to {account}.</p>
    <div className="my-6 rounded-xl bg-[#f7fee7] p-4 text-sm">Allow creating new notes and deploying new HTML pages. Existing content cannot be overwritten or deleted.</div>
    <form className="flex gap-3">
      {Object.entries({ client_id:p.client_id, redirect_uri:p.redirect_uri, state:p.state, code_challenge:p.code_challenge, code_challenge_method:"S256" }).map(([k,v]) => v ? <input key={k} type="hidden" name={k} value={v}/> : null)}
      <button formAction={denyAuthorization} className="flex-1 rounded-xl border px-4 py-3 font-semibold">Deny</button>
      <button formAction={approveAuthorization} className="flex-1 rounded-xl bg-[#C1FF00] px-4 py-3 font-bold">Allow access</button>
    </form>
  </section></main>;
}
