"use client";

import { useEffect, useState } from "react";
import { getInvoices } from "@/app/actions";
import { Loader2, Receipt } from "lucide-react";

export function InvoicesList() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchInvoices() {
            try {
                const res = await getInvoices();
                if (res.success && res.data) {
                    setInvoices(res.data);
                } else {
                    setError(res.error || "Failed to load invoices");
                }
            } catch (err: any) {
                setError(err.message || "An error occurred");
            } finally {
                setIsLoading(false);
            }
        }
        fetchInvoices();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-sm p-4">{error}</div>;
    }

    if (invoices.length === 0) {
        return (
            <div className="text-center p-8 border border-slate-100 rounded-xl bg-slate-50">
                <p className="text-slate-500 text-sm">No payment history found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-2xl mx-auto w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Receipt size={20} />
                Billing History
            </h3>
            {invoices.map((inv) => (
                <div key={inv.payment_id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                    <div>
                        <p className="font-semibold text-slate-900">
                            {inv.webhook_data?.product_cart?.[0]?.product_name || inv.brand_id || 'Subscription Payment'}
                        </p>
                        <p className="text-xs text-slate-500">
                            {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-slate-900">
                            ${(inv.total_amount / 100).toFixed(2)} {inv.currency}
                        </p>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${inv.status === 'succeeded' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {inv.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
