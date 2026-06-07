#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { createClerkClient } = require("@clerk/backend");

// Load .env file (same approach as publish-blog.js).
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  const idx = line.indexOf("=");
  if (idx === -1) return;
  const key = line.slice(0, idx).trim();
  const value = line.slice(idx + 1).trim();
  // Don't override vars already set in the environment (e.g. an inline
  // CLERK_SECRET_KEY=sk_live_... prefix), matching dotenv semantics.
  if (key && value && !(key in process.env)) process.env[key] = value;
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!clerkSecretKey) {
  console.error("Error: Missing CLERK_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const clerk = createClerkClient({ secretKey: clerkSecretKey });

// Upsert one subscriber, preserving status/last_emailed_at for existing rows.
async function upsert(email, name, clerkUserId, source) {
  if (!email) return false;
  const { error } = await supabase.from("email_subscribers").upsert(
    {
      email: email.toLowerCase(),
      name: name || null,
      clerk_user_id: clerkUserId || null,
      source,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );
  if (error) {
    console.error(`  ! upsert failed for ${email}:`, error.message);
    return false;
  }
  return true;
}

async function syncClerkUsers() {
  let offset = 0;
  const limit = 500;
  let total = 0;

  for (;;) {
    const { data } = await clerk.users.getUserList({ limit, offset });
    if (!data || data.length === 0) break;

    for (const u of data) {
      const primary =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId) ||
        u.emailAddresses[0];
      const email = primary?.emailAddress;
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
      if (await upsert(email, name, u.id, "clerk")) total++;
    }

    console.log(`  synced ${offset + data.length} clerk users...`);
    if (data.length < limit) break;
    offset += limit;
  }

  return total;
}

async function syncTable(table, emailCol, source) {
  const { data, error } = await supabase.from(table).select(emailCol);
  if (error) {
    console.warn(`  (skipping ${table}: ${error.message})`);
    return 0;
  }
  let total = 0;
  for (const row of data || []) {
    if (await upsert(row[emailCol], null, null, source)) total++;
  }
  return total;
}

async function main() {
  console.log("Syncing Clerk users -> email_subscribers...");
  const clerkCount = await syncClerkUsers();
  console.log(`  ${clerkCount} clerk subscribers upserted.`);

  console.log("Syncing waitlist...");
  const waitlistCount = await syncTable("waitlist", "email", "waitlist");
  console.log(`  ${waitlistCount} waitlist subscribers upserted.`);

  console.log("Syncing subscriptions (customer_email)...");
  const subCount = await syncTable("subscriptions", "customer_email", "subscription");
  console.log(`  ${subCount} subscription subscribers upserted.`);

  const { count } = await supabase
    .from("email_subscribers")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  console.log(`\nDone. Active subscribers in list: ${count || 0}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
