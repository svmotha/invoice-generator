import { z } from "zod";

/**
 * Shared data model for the invoice generator. These Zod schemas are the single
 * source of truth: API routes validate against them and the inferred types flow
 * through the UI and storage layers.
 *
 * All money values are integer minor units (cents). See lib/money.ts.
 */

export const currencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Use a 3-letter ISO currency code, e.g. USD");

/**
 * Payment terms. The enum values are stable internal codes (kept as-is so
 * existing stored invoices need no migration); the user-facing text lives in
 * TERM_LABEL below.
 */
export const paymentTermsSchema = z.enum(["due_on_receipt", "net_7", "net_15", "net_30", "net_60"]);
export type PaymentTerms = z.infer<typeof paymentTermsSchema>;

/** Terms in display order, for select inputs. */
export const PAYMENT_TERMS: PaymentTerms[] = [
  "due_on_receipt",
  "net_7",
  "net_15",
  "net_30",
  "net_60",
];

/** Number of days each term adds to the issue date. */
export const TERM_DAYS: Record<PaymentTerms, number> = {
  due_on_receipt: 0,
  net_7: 7,
  net_15: 15,
  net_30: 30,
  net_60: 60,
};

/** Human-facing label for each term (single source of truth for all UI + PDF). */
export const TERM_LABEL: Record<PaymentTerms, string> = {
  due_on_receipt: "Due on Receipt",
  net_7: "7 Days",
  net_15: "15 Days",
  net_30: "30 Days",
  net_60: "60 Days",
};

export const invoiceStatusSchema = z.enum(["draft", "sent", "paid", "overdue"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

/** An address block used for both the business and the client. */
export const partySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  addressLine1: z.string().optional().default(""),
  addressLine2: z.string().optional().default(""),
  city: z.string().optional().default(""),
  region: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  country: z.string().optional().default(""),
  taxId: z.string().optional().default(""),
});
export type Party = z.infer<typeof partySchema>;

export const clientSchema = partySchema.extend({
  id: z.string(),
  createdAt: z.string(),
});
export type Client = z.infer<typeof clientSchema>;

export const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  /** Unit price in cents. */
  unitPriceCents: z.number().int().nonnegative(),
});
export type LineItem = z.infer<typeof lineItemSchema>;

/**
 * Banking details the invoice sender is paid into. Stored once in settings and
 * snapshotted onto each new invoice. The account holder (the business name) and
 * the payment reference (the invoice number) are derived at render time, so
 * they are not stored here.
 */
export const paymentDetailsSchema = z.object({
  bank: z.string().optional().default(""),
  accountType: z.string().optional().default(""),
  accountNumber: z.string().optional().default(""),
  branchCode: z.string().optional().default(""),
});
export type PaymentDetails = z.infer<typeof paymentDetailsSchema>;

/** Whether any payment detail has been filled in (used to gate display). */
export function hasPaymentDetails(pd?: PaymentDetails | null): boolean {
  return Boolean(pd && (pd.bank || pd.accountNumber || pd.accountType || pd.branchCode));
}

/** The business's own profile and defaults, stored in settings.json. */
export const settingsSchema = z.object({
  business: partySchema,
  /** Data URL or public path for the logo; optional. */
  logo: z.string().optional().default(""),
  defaultCurrency: currencyCodeSchema.default("ZAR"),
  defaultTerms: paymentTermsSchema.default("net_30"),
  /** Banking details pre-filled onto new invoices' payment section. */
  paymentDetails: paymentDetailsSchema.default({
    bank: "",
    accountType: "",
    accountNumber: "",
    branchCode: "",
  }),
  /**
   * Whether the business is VAT-registered. A business that is not registered
   * cannot charge VAT, so new invoices default their tax to 0% when this is off.
   */
  vatRegistered: z.boolean().default(true),
  /** Standard VAT rate applied on new invoices when VAT-registered (SA VAT is 15%). */
  defaultTaxPercent: z.number().min(0).max(100).default(15),
  defaultNotes: z.string().optional().default(""),
  /** Next auto-incrementing invoice number. */
  nextInvoiceSeq: z.number().int().positive().default(1),
  invoicePrefix: z.string().default("INV-"),
});
export type Settings = z.infer<typeof settingsSchema>;

/**
 * The supplier "from" party derived from current settings. Omits the VAT
 * registration number when the business is not VAT-registered, so invoices
 * never display a VAT number (or read as a "tax invoice") in that case.
 */
export function businessFromSettings(settings: Settings): Party {
  if (settings.vatRegistered) return settings.business;
  return { ...settings.business, taxId: "" };
}

export const invoiceSchema = z.object({
  id: z.string(),
  /** Human-facing number, e.g. "INV-0001". */
  number: z.string().min(1),
  status: invoiceStatusSchema.default("draft"),
  currency: currencyCodeSchema.default("ZAR"),

  from: partySchema,
  to: partySchema,

  /**
   * Banking details snapshotted from settings at creation. Optional: invoices
   * created before this feature won't have it and are intentionally left as-is.
   */
  paymentDetails: paymentDetailsSchema.optional(),

  issueDate: z.string(), // ISO date (YYYY-MM-DD)
  dueDate: z.string(), // ISO date (YYYY-MM-DD)
  terms: paymentTermsSchema.default("net_30"),

  items: z.array(lineItemSchema).min(1, "Add at least one line item"),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).max(100).default(0),

  notes: z.string().optional().default(""),

  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Invoice = z.infer<typeof invoiceSchema>;

/** Payload accepted when creating/updating an invoice (server fills the rest). */
export const invoiceInputSchema = invoiceSchema.omit({
  id: true,
  number: true,
  createdAt: true,
  updatedAt: true,
});
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;

/**
 * Display status. "overdue" is derived, not stored: a sent invoice whose due
 * date has passed shows as overdue without any background job.
 */
export function effectiveStatus(
  invoice: Pick<Invoice, "status" | "dueDate">,
  today = new Date().toISOString().slice(0, 10)
): InvoiceStatus {
  if (invoice.status === "sent" && invoice.dueDate < today) return "overdue";
  return invoice.status;
}

/** Compute an ISO due date from an ISO issue date and payment terms. */
export function dueDateFromTerms(issueDate: string, terms: PaymentTerms): string {
  const d = new Date(`${issueDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + TERM_DAYS[terms]);
  return d.toISOString().slice(0, 10);
}
