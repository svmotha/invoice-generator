import { z } from "zod";
import {
  paymentTermsSchema,
  partySchema,
  currencyCodeSchema,
  type InvoiceInput,
  type Party,
  type PaymentDetails,
} from "./schema";
import { toCents, fromCents } from "./money";

/**
 * The invoice builder works with unit prices as decimal dollars (what the user
 * types) rather than integer cents. This module defines that form shape and the
 * mapping to/from the stored `Invoice` model, so the /new and /[id] pages share
 * one source of truth.
 */

export const builderItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Qty must be > 0"),
  /** Decimal dollars, e.g. 10.5 — converted to cents on save. */
  unitPrice: z.number().nonnegative("Price can't be negative"),
});
export type BuilderItem = z.infer<typeof builderItemSchema>;

export const builderSchema = z.object({
  to: partySchema,
  currency: currencyCodeSchema,
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  terms: paymentTermsSchema,
  items: z.array(builderItemSchema).min(1, "Add at least one line item"),
  discountPercent: z.number().min(0).max(100),
  taxPercent: z.number().min(0).max(100),
  notes: z.string(),
});
export type BuilderValues = z.infer<typeof builderSchema>;
/** Pre-parse form shape (fields with schema defaults are optional). Used as react-hook-form's field-values type. */
export type BuilderInput = z.input<typeof builderSchema>;

/** A blank line item with a fresh id for useFieldArray. Uses global Web Crypto (works in Node 19+ and browsers). */
export function emptyItem(): BuilderItem {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 };
}

/**
 * Convert validated builder values + the business "from" party into the stored
 * input shape. Pass the existing status when editing so it is preserved.
 */
export function toInvoiceInput(
  values: BuilderValues,
  from: Party,
  status: InvoiceInput["status"] = "draft",
  paymentDetails?: PaymentDetails
): InvoiceInput {
  return {
    status,
    currency: values.currency,
    from,
    to: values.to,
    paymentDetails,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    terms: values.terms,
    items: values.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: toCents(item.unitPrice),
    })),
    discountPercent: values.discountPercent,
    taxPercent: values.taxPercent,
    notes: values.notes,
  };
}

/** Map a stored invoice's line items back to builder items (cents -> dollars). */
export function itemsToBuilder(
  items: { id: string; description: string; quantity: number; unitPriceCents: number }[]
): BuilderItem[] {
  return items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: fromCents(item.unitPriceCents),
  }));
}
