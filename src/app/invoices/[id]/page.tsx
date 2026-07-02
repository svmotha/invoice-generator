import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/storage";
import { computeTotals, formatMoney } from "@/lib/money";
import type { InvoiceStatus } from "@/lib/schema";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

type Params = { params: Promise<{ id: string }> };

export default async function InvoiceViewPage({ params }: Params) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const { totalCents } = computeTotals({
    items: invoice.items,
    discountPercent: invoice.discountPercent,
    taxPercent: invoice.taxPercent,
  });
  const pdfUrl = `/api/invoices/${invoice.id}/pdf`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
            ← Invoices
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{invoice.number}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[invoice.status]}`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-500">
            {invoice.to.name} · <span className="tabular-nums">{formatMoney(totalCents, invoice.currency)}</span>
          </span>
          <a
            href={pdfUrl}
            download={`${invoice.number}.pdf`}
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Download PDF
          </a>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <iframe
          title={`Invoice ${invoice.number} preview`}
          src={pdfUrl}
          className="h-[80vh] w-full bg-neutral-100 dark:bg-neutral-900"
        />
      </div>
    </div>
  );
}
