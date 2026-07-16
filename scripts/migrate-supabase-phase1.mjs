import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const connectionString = process.env.SUPABASE_MIGRATION_URL;
if (!connectionString) {
  throw new Error("SUPABASE_MIGRATION_URL is required.");
}

let parsed;
try {
  parsed = new URL(connectionString);
} catch {
  throw new Error("SUPABASE_MIGRATION_URL is not a valid URL.");
}
if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
  throw new Error("SUPABASE_MIGRATION_URL must use the postgres or postgresql protocol.");
}
if (parsed.hostname.toLowerCase().includes("pooler")) {
  throw new Error("SUPABASE_MIGRATION_URL must use the direct database endpoint, not a pooler.");
}

const migrations = [
  "202607140001_connector_oauth_phase1.sql",
  "202607140002_forms_projection_outbox.sql",
  "202607140003_oauth_rate_limits.sql",
  "202607140004_connector_feedback.sql",
  "202607160001_mcp_authorization_hot_path.sql",
].map((name) => fileURLToPath(new URL(`../supabase/migrations/${name}`, import.meta.url)));

const result = spawnSync(
  "psql",
  [
    "--dbname",
    connectionString,
    "--no-psqlrc",
    "--set=ON_ERROR_STOP=1",
    "--command",
    "do $$ begin if not pg_try_advisory_lock(745263110, 327622) then raise exception 'Another Jobing Supabase migration is running'; end if; end $$;",
    ...migrations.flatMap((file) => ["--file", file]),
    "--command",
    "do $$ begin perform pg_advisory_unlock(745263110, 327622); end $$;",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PGCONNECT_TIMEOUT: process.env.PGCONNECT_TIMEOUT || "10",
    },
  },
);

if (result.error) {
  throw new Error(`Could not run psql: ${result.error.message}`);
}
if (result.status !== 0) {
  process.exitCode = result.status ?? 1;
} else {
  process.stdout.write("Main Supabase Phase 1 migrations are applied.\n");
}
