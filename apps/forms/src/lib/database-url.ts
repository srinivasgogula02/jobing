const SSL_MODES_REQUIRING_EXPLICIT_VERIFICATION = new Set([
  "prefer",
  "require",
  "verify-ca",
]);

export function hardenDatabaseSslMode(connectionString: string) {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }

  const sslMode = url.searchParams.get("sslmode");
  if (sslMode && SSL_MODES_REQUIRING_EXPLICIT_VERIFICATION.has(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}
