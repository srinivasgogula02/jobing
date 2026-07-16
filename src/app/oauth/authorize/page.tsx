import { auth, currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  getClient,
  getMcpResourceUrl,
  isValidPkceS256Challenge,
} from "@/lib/oauth";
import { oauthClientDisplayIdentity } from "@/lib/oauth-client-metadata";
import {
  InvalidOAuthScopeError,
  OAUTH_SCOPE_DETAILS,
  normalizeRequestedScopes,
  serializeOAuthScopes,
  type OAuthScope,
} from "@/lib/oauth-scopes";
import { AuthorizationActions } from "./AuthorizationActions";

export const dynamic = "force-dynamic";

type Params = {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  state?: string;
  scope?: string;
  resource?: string;
  code_challenge?: string;
  code_challenge_method?: string;
};

function authorizationQuery(params: Params): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) query.set(key, value);
  }
  return query.toString();
}

function oauthRedirect(base: string, values: Record<string, string | undefined>): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(values)) if (value) url.searchParams.set(key, value);
  return url.toString();
}

function InvalidRequest() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0E1219] p-6 text-[#F2F4F7]">
      <section className="w-full max-w-md rounded-xl border border-[#262D3A] bg-[#161B25] p-6">
        <p className="font-mono text-xs uppercase tracking-[.16em] text-[#E8736B]">Connection stopped</p>
        <h1 className="mt-3 text-2xl font-semibold">Invalid connector request</h1>
        <p className="mt-3 leading-7 text-[#8B93A1]">Return to your AI app and start the connection again.</p>
      </section>
    </main>
  );
}

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) {
    const returnTo = `/oauth/authorize?${authorizationQuery(params)}`;
    redirect(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
  }

  const clientId = params.client_id || "";
  const redirectUri = params.redirect_uri || "";
  const state = params.state && params.state.length <= 2048 ? params.state : undefined;
  const challenge = params.code_challenge || "";
  const expectedResource = getMcpResourceUrl();
  const resource = params.resource || expectedResource;
  const client = clientId.length <= 256 ? await getClient(clientId) : null;

  if (
    params.response_type !== "code"
    || !client
    || redirectUri.length > 2048
    || !client.redirect_uris.includes(redirectUri)
    || params.code_challenge_method !== "S256"
    || !isValidPkceS256Challenge(challenge)
    || resource !== expectedResource
  ) {
    return <InvalidRequest />;
  }

  let scopes: OAuthScope[];
  try {
    scopes = normalizeRequestedScopes(params.scope);
  } catch (error) {
    if (error instanceof InvalidOAuthScopeError) {
      redirect(oauthRedirect(redirectUri, { error: "invalid_scope", error_description: error.message, state }));
    }
    throw error;
  }

  const scope = serializeOAuthScopes(scopes);
  const clientIdentity = oauthClientDisplayIdentity(client, redirectUri);
  const user = await currentUser();
  const account = user?.primaryEmailAddress?.emailAddress || "your Jobing account";

  return (
    <main className="flex min-h-[100svh] items-center bg-[#f7f8f4] p-3 text-[#151914] sm:p-6">
      <section className="mx-auto flex max-h-[calc(100svh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-[8px] border border-[#dfe3da] bg-white shadow-[0_24px_80px_rgba(31,40,25,.12)] sm:max-h-[calc(100svh-3rem)]">
        <header className="shrink-0 border-b border-[#e8ebe5] px-5 py-5 sm:px-7">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={30} height={30} className="rounded-[6px]" priority />
            <span className="font-bold tracking-[-.025em]">Jobing AI</span>
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#719500]">Approve connection</p>
          <h1 className="mt-2 text-2xl font-bold tracking-[-.035em] sm:text-3xl">Let this AI app work with Jobing?</h1>
          <p className="mt-2 text-sm leading-6 text-[#6e756b]">
            <span className="font-semibold text-[#151914]">{clientIdentity.redirectOrigin}</span> wants to connect to {account}.
          </p>
          {clientIdentity.unverifiedName ? <p className="mt-1 text-xs leading-5 text-[#8a9186]">The app identifies itself as <bdi className="font-semibold text-[#4d554b]">{clientIdentity.unverifiedName}</bdi>.</p> : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 slim-scrollbar sm:px-7">
          <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#7b8277]">This app can</p>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {scopes.map((item) => (
              <li key={item} className="grid grid-cols-[18px_1fr] gap-2.5 border-t border-[#edf0ea] pt-2.5">
                <span className="mt-0.5 text-sm font-bold text-[#719500]" aria-hidden>✓</span>
                <span>
                  <span className="block text-sm font-semibold text-[#252b23]">{OAUTH_SCOPE_DETAILS[item].title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#747c71]">{OAUTH_SCOPE_DETAILS[item].description}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-[#e8ebe5] pt-4 text-xs leading-5 text-[#747c71]">
            {scopes.includes("forms.responses:read")
              ? "Uploaded file contents and integration credentials are not included."
              : "Form responses, uploaded file contents, and integration credentials are not included."}{" "}
            Disconnect this app at any time from your Dashboard.
          </p>
        </div>

        <form className="grid shrink-0 grid-cols-[.8fr_1.2fr] gap-2 border-t border-[#dfe3da] bg-white p-4 sm:gap-3 sm:px-7 sm:py-5">
          {Object.entries({
            client_id: clientId,
            redirect_uri: redirectUri,
            state,
            scope,
            resource,
            code_challenge: challenge,
            code_challenge_method: "S256",
          }).map(([key, value]) => value ? <input key={key} type="hidden" name={key} value={value} /> : null)}
          <AuthorizationActions />
        </form>
      </section>
    </main>
  );
}
