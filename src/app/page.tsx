import Link from "next/link";
import { getSettings, listInvoices } from "@/lib/storage";
import { computeTotals, formatMoney } from "@/lib/money";
import { effectiveStatus, type InvoiceStatus } from "@/lib/schema";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function HomePage() {
  const [settings, invoices] = await Promise.all([getSettings(), listInvoices()]);
  const needsSetup = !settings.business.name;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <Link
          href="/invoices/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          New invoice
        </Link>
      </div>

      {needsSetup ? (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
          Finish setting up your{" "}
          <Link href="/settings" className="font-medium underline">
            business details
          </Link>{" "}
          so they appear on your invoices.
        </div>
      ) : null}

      {invoices.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No invoices yet.{" "}
          <Link href="/invoices/new" className="font-medium underline">
            Create your first one
          </Link>
          .
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {invoices.map((inv) => {
                const { totalCents } = computeTotals({
                  items: inv.items,
                  discountPercent: inv.discountPercent,
                  taxPercent: inv.taxPercent,
                });
                return (
                  <tr key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{inv.to.name}</td>
                    <td className="px-4 py-3 text-neutral-500">{inv.issueDate}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const s = effectiveStatus(inv);
                        return (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[s]}`}>
                            {s}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(totalCents, inv.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
