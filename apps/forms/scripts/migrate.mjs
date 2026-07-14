import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const MIGRATION_FILE = /^(\d{6})_([a-z0-9_]+)\.sql$/;
const ADVISORY_LOCK = [745263110, 327621];
const migrationsDirectory = fileURLToPath(new URL("../db/migrations/", import.meta.url));

function migrationUrl() {
  const raw = process.env.DATABASE_MIGRATION_URL;
  if (!raw) throw new Error("DATABASE_MIGRATION_URL is required.");

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("DATABASE_MIGRATION_URL is not a valid URL.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("DATABASE_MIGRATION_URL must use the postgres or postgresql protocol.");
  }
  if (parsed.hostname.includes("-pooler")) {
    throw new Error("DATABASE_MIGRATION_URL must be a direct Neon connection, not a pooled endpoint.");
  }
  return raw;
}

async function loadMigrations() {
  const names = (await readdir(migrationsDirectory)).filter((name) => name.endsWith(".sql")).sort();
  if (names.length === 0) throw new Error(`No SQL migrations found in ${migrationsDirectory}.`);

  const migrations = [];
  const versions = new Set();
  for (const [index, name] of names.entries()) {
    const match = MIGRATION_FILE.exec(name);
    if (!match) throw new Error(`Invalid migration filename: ${name}`);
    const version = Number(match[1]);
    if (versions.has(version)) throw new Error(`Duplicate migration version: ${match[1]}`);
    if (version !== index + 1) {
      throw new Error(`Migration history must be contiguous from 000001; expected version ${index + 1}, found ${version}.`);
    }
    versions.add(version);

    const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
    if (/^\s*(begin|commit|rollback)\s*;/im.test(sql)) {
      throw new Error(`${name} contains transaction control. The migration runner owns the transaction.`);
    }
    migrations.push({
      version,
      name,
      sql,
      checksum: createHash("sha256").update(sql, "utf8").digest("hex"),
    });
  }
  return migrations;
}

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists public.jobing_forms_schema_migrations (
      version bigint primary key,
      name text not null unique,
      checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
      execution_ms integer not null check (execution_ms >= 0),
      applied_at timestamptz not null default clock_timestamp()
    )
  `);
  await client.query("revoke all on public.jobing_forms_schema_migrations from public");
}

async function verifyHistory(client, migrations) {
  const result = await client.query(
    "select version::text, name, checksum from public.jobing_forms_schema_migrations order by version::bigint",
  );
  if (result.rows.length > migrations.length) {
    throw new Error("The database has more applied migrations than this checkout.");
  }

  for (const [index, applied] of result.rows.entries()) {
    const local = migrations[index];
    if (applied.version !== String(local.version)) {
      throw new Error(
        `Applied migrations must be an exact prefix of local history; expected ${local.version}, found ${applied.version}. ` +
        `Database sequence: ${result.rows.map((row) => row.version).join(",")}. ` +
        `Local sequence: ${migrations.map((migration) => migration.version).join(",")}.`,
      );
    }
    if (local.name !== applied.name) {
      throw new Error(`Migration ${applied.version} was renamed from ${applied.name} to ${local.name}.`);
    }
    if (local.checksum !== applied.checksum) {
      throw new Error(`Checksum mismatch for applied migration ${local.name}. Applied migrations are immutable.`);
    }
  }
  return new Set(result.rows.map((row) => Number(row.version)));
}

async function applyMigration(client, migration) {
  const startedAt = performance.now();
  await client.query("begin");
  try {
    await client.query("set local lock_timeout = '5s'");
    await client.query("set local statement_timeout = '2min'");
    await client.query(migration.sql);
    const executionMs = Math.max(0, Math.round(performance.now() - startedAt));
    await client.query(
      `insert into public.jobing_forms_schema_migrations (version, name, checksum, execution_ms)
       values ($1, $2, $3, $4)`,
      [migration.version, migration.name, migration.checksum, executionMs],
    );
    await client.query("commit");
    console.log(`applied ${migration.name} (${executionMs}ms)`);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }
}

async function main() {
  const migrations = await loadMigrations();
  const client = new Client({
    connectionString: migrationUrl(),
    application_name: "jobing-forms-migrator",
    connectionTimeoutMillis: 10_000,
  });

  let locked = false;
  try {
    await client.connect();
    const lockResult = await client.query("select pg_try_advisory_lock($1, $2) as locked", ADVISORY_LOCK);
    locked = lockResult.rows[0]?.locked === true;
    if (!locked) throw new Error("Another Jobing Forms migration process holds the database lock.");
    await ensureMigrationTable(client);
    const applied = await verifyHistory(client, migrations);
    const pending = migrations.filter((migration) => !applied.has(migration.version));

    for (const migration of pending) await applyMigration(client, migration);
    console.log(pending.length === 0 ? "database is up to date" : `applied ${pending.length} migration(s)`);
  } finally {
    if (locked) await client.query("select pg_advisory_unlock($1, $2)", ADVISORY_LOCK).catch(() => undefined);
    await client.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error("Forms database migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
