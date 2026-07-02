import Link from "next/link";
import { InvoiceForm } from "@/components/InvoiceForm";
import { emptyItem, type BuilderValues } from "@/lib/invoiceForm";
import { dueDateFromTerms } from "@/lib/schema";
import { getSettings } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const settings = await getSettings();
  const today = new Date().toISOString().slice(0, 10);

  const defaults: BuilderValues = {
    to: {
      name: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
      taxId: "",
    },
    currency: settings.defaultCurrency,
    issueDate: today,
    terms: settings.defaultTerms,
    dueDate: dueDateFromTerms(today, settings.defaultTerms),
    items: [emptyItem()],
    discountPercent: 0,
    taxPercent: settings.defaultTaxPercent,
    notes: settings.defaultNotes ?? "",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          ← Back
        </Link>
      </div>
      <div className="mt-8">
        <InvoiceForm from={settings.business} defaults={defaults} />
      </div>
    </div>
  );
}
