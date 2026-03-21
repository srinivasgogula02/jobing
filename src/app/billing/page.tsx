import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserSubscription, getInvoices } from "@/app/actions/billing";
import { BillingDashboard } from "@/components/billing/BillingDashboard";

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
    const userRow = subRes.success ? subRes.data?.user : null;
    const invoices = invoicesRes.success ? (invoicesRes as any).data : [];

    const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);

    return (
        <main className="min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8">
            <BillingDashboard
                subscription={subscription}
                userRow={userRow}
                invoices={invoices}
                userName={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User'}
                userEmail={primaryEmail?.emailAddress || ''}
            />
        </main>
    );
}
