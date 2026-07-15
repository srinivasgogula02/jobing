import { auth, currentUser } from "@clerk/nextjs/server";
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
    <main className="grid min-h-screen place-items-center bg-[#0E1219] p-4 text-[#F2F4F7] sm:p-6">
      <section className="w-full max-w-lg rounded-[20px] border border-[#262D3A] bg-[#161B25] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[#C6F24E]">Jobing connector</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-.03em]">Approve this connection</h1>
        <p className="mt-3 leading-7 text-[#8B93A1]">
          <span className="font-medium text-[#F2F4F7]">{clientIdentity.redirectOrigin}</span> wants to use {account}.
        </p>
        {clientIdentity.unverifiedName ? (
          <p className="mt-2 text-sm leading-6 text-[#8B93A1]">
            Client-reported name (unverified): <bdi className="text-[#F2F4F7]">{clientIdentity.unverifiedName}</bdi>
          </p>
        ) : null}

        <div className="mt-6 rounded-xl border border-[#262D3A] bg-[#1F2531] p-4">
          <p className="font-mono text-[11px] uppercase tracking-[.12em] text-[#8B93A1]">This connection can</p>
          <ul className="mt-4 space-y-4">
            {scopes.map((item) => (
              <li key={item} className="grid grid-cols-[8px_1fr] gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-[#C6F24E]" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold">{OAUTH_SCOPE_DETAILS[item].title}</span>
                  <span className="mt-1 block text-sm leading-6 text-[#8B93A1]">{OAUTH_SCOPE_DETAILS[item].description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-sm leading-6 text-[#8B93A1]">
          {scopes.includes("forms.responses:read")
            ? "Uploaded file contents and integration credentials are not included."
            : "Form responses, uploaded file contents, and integration credentials are not included."}{" "}
          You can disconnect this client at any time.
        </p>

        <form className="mt-6 grid gap-3 sm:grid-cols-2">
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
