import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserSubscription, getInvoices } from "@/app/actions/billing";
import { BillingDashboard } from "@/components/billing/BillingDashboard";
import { DashboardLayout } from "@/components/DashboardLayout";

export const metadata = {
  title: "Billing | Jobing AI",
};

export default async function BillingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [subRes, invoicesRes] = await Promise.all([
    getUserSubscription(),
    getInvoices(),
  ]);

  const subscription = subRes.success ? subRes.data?.subscription : null;
  const invoices = invoicesRes.success ? invoicesRes.data : [];

  return (
    <DashboardLayout>
      <BillingDashboard
        subscription={subscription}
        invoices={invoices}
        isLiveMode={process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"}
      />
    </DashboardLayout>
  );
}
