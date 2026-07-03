import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/InvoiceForm";
import { itemsToBuilder, type BuilderValues } from "@/lib/invoiceForm";
import { businessFromSettings } from "@/lib/schema";
import { getInvoice, getSettings, listClients } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function EditInvoicePage({ params }: Params) {
  const { id } = await params;
  const [invoice, settings, clients] = await Promise.all([
    getInvoice(id),
    getSettings(),
    listClients(),
  ]);
  if (!invoice) notFound();

  const defaults: BuilderValues = {
    to: invoice.to,
    currency: invoice.currency,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    terms: invoice.terms,
    items: itemsToBuilder(invoice.items),
    discountPercent: invoice.discountPercent,
    taxPercent: invoice.taxPercent,
    notes: invoice.notes ?? "",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Edit {invoice.number}</h1>
        <Link
          href={`/invoices/${invoice.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          ← Cancel
        </Link>
      </div>
      <div className="mt-8">
        {/* Refresh the supplier "from" from current settings so edits pick up
            the latest business address, email, VAT number, etc. */}
        <InvoiceForm
          from={businessFromSettings(settings)}
          defaults={defaults}
          clients={clients}
          invoiceId={invoice.id}
          status={invoice.status}
        />
      </div>
    </div>
  );
}
