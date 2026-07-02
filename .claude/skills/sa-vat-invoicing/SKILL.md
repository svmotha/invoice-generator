---
name: sa-vat-invoicing
description: South African VAT and tax-invoice rules (SARS / VAT Act) for this invoice generator. Use when building or changing anything that touches invoice content, VAT calculation, tax-invoice wording/fields, VAT registration, credit/debit notes, or currency formatting for ZAR — so output stays compliant with SARS requirements.
---

# South African VAT invoicing

Reference for keeping invoices compliant with the **Value-Added Tax Act 89 of
1991** (primarily **section 20**, tax invoices) and current SARS practice. This
is engineering guidance, **not legal or tax advice** — confirm current rules
with SARS (sars.gov.za) or a registered tax practitioner before relying on it.

## Core facts

- **Standard VAT rate: 15%** (effective 1 April 2018). Proposed increases in the
  2025 Budget were withdrawn; the rate remains 15%. Never hard-code the rate in a
  way that can't be changed — store it as data (see `defaultTaxPercent`).
- **Registration thresholds:** compulsory once taxable supplies exceed
  **R1 million** in any consecutive 12-month period; voluntary registration is
  allowed once they exceed **R50,000** in the past 12 months.
- **A business that is not VAT-registered may not charge VAT** or issue a "tax
  invoice". It issues an ordinary "invoice" with no VAT line. This app models
  that with `settings.vatRegistered`; keep that gate intact.
- **VAT registration number** is 10 digits and begins with **4** (e.g.
  `4xxxxxxxxx`). Reasonable to validate format, but don't block on it hard.
- **Currency:** amounts in **ZAR**, South African format (e.g. `R 1 500,00` —
  space thousands separator, comma decimal). Handled by `formatMoney` (en-ZA).
- **Timing:** a tax invoice must be issued within **21 days** of the supply when
  the recipient requests it.
- **One original per supply:** only one tax invoice per taxable supply. Any
  reissue must be marked **"copy"**.
- **Record retention:** keep invoices and records for **5 years**.

## Required fields

Which fields are required depends on the VAT-inclusive total ("consideration").

### Full tax invoice — consideration **> R5,000** (s20(4))

1. The words **"Tax Invoice"**, "VAT Invoice" or "Invoice".
2. **Supplier**: name, address, and VAT registration number.
3. **Recipient**: name, address, and — where the recipient is a registered
   vendor — the recipient's VAT registration number.
4. **Serial number** and **date of issue**.
5. Accurate **description** of the goods/services (flag second-hand goods).
6. **Quantity or volume** supplied.
7. Either (a) the **value** of the supply, the **VAT amount**, and the
   **consideration** (value + VAT); or (b) the consideration together with a
   **statement that it includes VAT at the rate** charged.

### Abridged tax invoice — consideration **R50–R5,000** (s20(5))

Same as above **except** recipient details (#3) and quantity (#6) are **not
required**. A full tax invoice is always acceptable in place of an abridged one.

### Consideration **≤ R50**

No tax invoice is required, but keep a document (e.g. till slip) as proof.

## Credit and debit notes (s21)

When the previously-invoiced amount changes (return, discount, error), issue a
**credit note** (reduction) or **debit note** (increase) that references the
original tax invoice, carries the same identifying particulars, states the
amount of the adjustment and the VAT on it, and includes the words "credit note"
/ "debit note". Do not alter or delete an already-issued tax invoice — adjust it
with a note.

## How this maps to the codebase

- VAT number lives on the party as `taxId` (`src/lib/schema.ts`); the supplier's
  is captured in Settings only when `vatRegistered` is on and snapshotted onto
  `invoice.from`.
- `src/lib/pdf/InvoiceDocument.tsx` titles the document **"TAX INVOICE"** when
  the supplier has a VAT number, else **"INVOICE"**, and prints supplier +
  recipient VAT numbers, serial number, date, line quantities, and an explicit
  **VAT (15%)** line — satisfying the full-tax-invoice fields above.
- VAT math is in `src/lib/money.ts` (`computeTotals`), in integer cents, rounded
  to the nearest cent.

## When changing invoice features, check

- [ ] Non-registered businesses never get a VAT line or "tax invoice" wording.
- [ ] The VAT rate stays data-driven (no magic `0.15` literals in logic).
- [ ] For totals **> R5,000**, recipient name + address are present; prompt for
      them rather than silently omitting.
- [ ] The document shows the required wording, both VAT numbers (when vendors),
      a unique serial number, date, description, quantity, value, VAT, and total.
- [ ] Amounts are ZAR-formatted and VAT is rounded to the cent.
- [ ] Amount/quantity corrections after issue go through a credit/debit note,
      not an edit that rewrites history.
