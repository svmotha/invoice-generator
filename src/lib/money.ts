/**
 * Money is stored and computed in integer minor units (cents) to avoid
 * floating-point rounding errors. Only convert to/from a decimal at the edges
 * (user input and display).
 */

/** Round to nearest integer, treating -0 as 0. */
function roundCents(value: number): number {
  const r = Math.round(value);
  return Object.is(r, -0) ? 0 : r;
}

/** Parse a user-entered decimal string/number (e.g. "10.50") into cents. */
export function toCents(amount: string | number): number {
  const n = typeof amount === "string" ? Number(amount.replace(/,/g, "")) : amount;
  if (!Number.isFinite(n)) return 0;
  return roundCents(n * 100);
}

/** Convert integer cents back to a decimal number (e.g. 1050 -> 10.5). */
export function fromCents(cents: number): number {
  return roundCents(cents) / 100;
}

export interface LineItemInput {
  /** Quantity, may be fractional (e.g. 1.5 hours). */
  quantity: number;
  /** Unit price in cents. */
  unitPriceCents: number;
}

/** Total for a single line, in cents. */
export function lineTotalCents(item: LineItemInput): number {
  return roundCents(item.quantity * item.unitPriceCents);
}

export interface TotalsInput {
  items: LineItemInput[];
  /** Discount as a percentage (0-100). */
  discountPercent?: number;
  /** Tax rate as a percentage (0-100). */
  taxPercent?: number;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  taxableCents: number;
  taxCents: number;
  totalCents: number;
}

/** Compute invoice totals. Discount applies to subtotal, tax applies after discount. */
export function computeTotals({
  items,
  discountPercent = 0,
  taxPercent = 0,
}: TotalsInput): Totals {
  const subtotalCents = items.reduce((sum, item) => sum + lineTotalCents(item), 0);
  const discountCents = roundCents((subtotalCents * discountPercent) / 100);
  const taxableCents = subtotalCents - discountCents;
  const taxCents = roundCents((taxableCents * taxPercent) / 100);
  const totalCents = taxableCents + taxCents;
  return { subtotalCents, discountCents, taxableCents, taxCents, totalCents };
}

/** Format integer cents as a currency string using the given ISO currency code. */
export function formatMoney(cents: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(fromCents(cents));
}
