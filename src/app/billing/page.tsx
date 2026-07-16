import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBillingOverviewForUser } from "@/lib/billing-data";
import { BillingDashboard } from "@/components/billing/BillingDashboard";
import { DashboardLayout } from "@/components/DashboardLayout";

export const metadata = {
  title: "Billing | Jobing AI",
};

export default async function BillingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { subscription, invoices } = await getBillingOverviewForUser(userId);

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
