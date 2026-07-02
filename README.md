# Invoice Generator

A simple invoice generator for small South African businesses. Set up your
business once, save your clients, build invoices with live totals, track their
status, and download a clean, SARS-compliant tax-invoice PDF.

Built with Next.js (App Router), React, TypeScript, Tailwind CSS, and
[`@react-pdf/renderer`](https://react-pdf.org). Data is stored locally as JSON
files under `data/` — no database to set up.

## Features

- **Business profile & defaults** — name, address, logo, VAT registration
  number, default currency/terms/VAT rate and payment notes.
- **VAT-aware** — defaults to South African **ZAR** and **15% VAT**. VAT is
  optional: a business that is not VAT-registered cannot charge VAT, and new
  invoices default to 0% VAT when the VAT-registered toggle is off.
- **Invoice builder** — line items with a live subtotal → discount → VAT →
  total, auto-incrementing invoice numbers, and terms-driven due dates.
- **Saved clients** — reuse client details across invoices from a picker.
- **Status tracking** — draft → sent → paid, with **overdue** derived
  automatically from the due date (no background job).
- **PDF** — professional A4 tax invoice, previewed in the browser and
  downloadable. Amounts render in South African format (e.g. `R 1 500,00`).

## Getting started

```bash
npm install
npm run seed   # optional: load sample business, clients, and invoices
npm run dev
```

Open http://localhost:3000. Start at **Settings** to enter your business
details (or run `npm run seed` first to explore with sample data).

## Scripts

| Command         | Description                                        |
| --------------- | -------------------------------------------------- |
| `npm run dev`   | Start the dev server                               |
| `npm run build` | Production build                                   |
| `npm run start` | Serve the production build                         |
| `npm run lint`  | Lint with ESLint                                   |
| `npm run seed`  | Populate `data/` with sample data (overwrites it)  |

## Project structure

```
src/
  app/                 # pages + API routes (App Router)
    api/               # /api/settings, /api/invoices, /api/clients
    invoices/          # /invoices/new, /invoices/[id], /invoices/[id]/edit
    clients/, settings/
  components/           # InvoiceForm, InvoiceActions, ClientsManager, SettingsForm
  lib/
    schema.ts          # Zod data model (single source of truth) + helpers
    money.ts           # integer-cents math (totals, VAT, ZAR formatting)
    storage.ts         # JSON persistence under /data (atomic writes)
    invoiceForm.ts     # builder form schema + mapping to the stored model
    pdf/               # react-pdf tax-invoice document
scripts/seed.mjs       # sample data generator
data/                  # local JSON store (git-ignored)
```

Money is stored and computed in **integer cents** to avoid floating-point
rounding errors; conversion to decimals happens only at input and display.

## South African VAT

Invoice fields and wording follow SARS tax-invoice requirements — see the
project skill at `.claude/skills/sa-vat-invoicing/` for the compliance
checklist this app is built against. That guidance is informational, not legal
or tax advice; confirm current rules with SARS or a registered practitioner.

## Notes

- Local file storage is intended for single-user/self-hosted use. The
  `storage.ts` API mirrors a database interface, so swapping in SQLite/Postgres
  later is localized to that one module.
