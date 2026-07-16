import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

const SUBSCRIPTION_COLUMNS = "subscription_id,product_id,status,currency,recurring_pre_tax_amount,next_billing_date,previous_billing_date,cancel_at_next_billing_date,cancelled_at,created_at,payment_period_interval,subscription_period_interval,customer_email,metadata";
const PAYMENT_COLUMNS = "payment_id,status,total_amount,currency,created_at,payment_method,card_network,card_last_four,card_type";

export async function getUserSubscriptionForUser(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data: userRow, error } = await supabase
    .from("users")
    .select("current_subscription_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !userRow?.current_subscription_id) return null;
  const { data } = await supabase
    .from("subscriptions")
    .select(SUBSCRIPTION_COLUMNS)
    .eq("subscription_id", userRow.current_subscription_id)
    .maybeSingle();
  return data ?? null;
}

export async function getInvoicesForUser(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data: userRow } = await supabase
    .from("users")
    .select("dodo_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (!userRow?.dodo_customer_id) return [];

  const { data, error } = await supabase
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("customer_id", userRow.dodo_customer_id)
    .order("created_at", { ascending: false });
  return error ? [] : data ?? [];
}

export async function getBillingOverviewForUser(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data: userRow } = await supabase
    .from("users")
    .select("current_subscription_id,dodo_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (!userRow) return { subscription: null, invoices: [] };
  const [subscriptionResult, paymentsResult] = await Promise.all([
    userRow.current_subscription_id
      ? supabase.from("subscriptions").select(SUBSCRIPTION_COLUMNS).eq("subscription_id", userRow.current_subscription_id).maybeSingle()
      : Promise.resolve({ data: null }),
    userRow.dodo_customer_id
      ? supabase.from("payments").select(PAYMENT_COLUMNS).eq("customer_id", userRow.dodo_customer_id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  return {
    subscription: subscriptionResult.data ?? null,
    invoices: paymentsResult.data ?? [],
  };
}
