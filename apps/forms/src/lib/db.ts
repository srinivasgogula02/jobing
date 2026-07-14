import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { Pool, type QueryResultRow } from "pg";

declare global {
  var __jobingFormsPool: Pool | undefined;
  var __jobingFormsPoolAttached: boolean | undefined;
}

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured for Jobing Forms.");
  return new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 7_000,
    query_timeout: 7_500,
    lock_timeout: 1_500,
    idle_in_transaction_session_timeout: 5_000,
    application_name: "jobing-forms-web",
  });
}

export function getPool() {
  const pool = globalThis.__jobingFormsPool ?? createPool();
  globalThis.__jobingFormsPool = pool;
  if (!globalThis.__jobingFormsPoolAttached) {
    attachDatabasePool(pool);
    globalThis.__jobingFormsPoolAttached = true;
  }
  return pool;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}
