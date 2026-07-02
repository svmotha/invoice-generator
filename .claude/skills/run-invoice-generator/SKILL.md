---
name: run-invoice-generator
description: How to run, preview, and smoke-test this invoice-generator app (Next.js 16). Use when asked to run/start/serve/preview the app, take a screenshot of it, load sample data, or confirm a change works in the real running app rather than only in tests.
---

# Running the invoice generator

Next.js 16 (App Router) app. Node 19+ required (uses global `crypto`). Data is
plain JSON under `data/` (git-ignored) — no database or env vars to configure.

## First-time setup

```bash
npm install
npm run seed   # optional: load sample business, clients, and invoices into data/
```

`npm run seed` overwrites `data/`. To start from an empty store instead, delete
it: `rm -rf data` (the app recreates files on first write, and Settings works
from built-in defaults: ZAR, 15% VAT).

## Dev server

```bash
npm run dev    # Turbopack; serves http://localhost:3000, ready in ~1s
```

Foreground `npm run dev` blocks the turn. To drive the app in the same turn,
background it and poll the log for readiness instead of a fixed sleep:

```bash
npm run dev > /tmp/next-dev.log 2>&1 &
DEV_PID=$!
for i in $(seq 1 40); do grep -q "Ready" /tmp/next-dev.log 2>/dev/null && break; sleep 1; done
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000     # expect 200
# ... exercise the app ...
kill $DEV_PID 2>/dev/null; wait $DEV_PID 2>/dev/null
```

Check `/tmp/next-dev.log` for compile/runtime errors: `grep -i "⨯\|Error" /tmp/next-dev.log`.

## Production build / serve

```bash
npm run build   # also runs full type-check; must pass clean
npm run start   # serve the optimized build on http://localhost:3000
```

## Key routes

- `/` — invoice list (dashboard) · `/invoices/new` — builder · `/invoices/[id]` —
  view + PDF preview · `/invoices/[id]/edit` — edit · `/clients` · `/settings`
- API: `/api/settings`, `/api/invoices`(`/[id]`, `/[id]/pdf`), `/api/clients`(`/[id]`)

## Smoke-testing without a browser

Drive the JSON API directly (see the build history for full examples):

```bash
# create an invoice, then fetch its PDF
ID=$(curl -s -X POST localhost:3000/api/invoices -H 'Content-Type: application/json' \
  -d '{...InvoiceInput...}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
curl -s localhost:3000/api/invoices/$ID/pdf -o /tmp/inv.pdf
python3 -c "d=open('/tmp/inv.pdf','rb').read();print('valid PDF:', d[:5]==b'%PDF-')"
```

## Visually verifying a PDF

`pdftoppm`/poppler and the Chrome extension are **not** available in this
environment. Rasterize the PDF's first page with macOS Quick Look, then Read the
PNG:

```bash
cd /tmp && qlmanage -t -s 1000 -o /tmp/ /tmp/inv.pdf   # -> /tmp/inv.pdf.png
```

To preview the on-screen UI (not just the PDF), send an HTML/served page or the
generated PDF to the user with the file tools rather than assuming a browser.

## Gotchas

- Data files are git-ignored; `rm -rf data` fully resets app state.
- react-pdf font subsetting makes extracted PDF text meaningless — verify PDFs by
  rasterizing (above) or by structural checks (`%PDF-` magic, `%%EOF`), not text
  greps.
- The invoice **route that generates the PDF is `.tsx`** (it renders JSX) and
  pins `runtime = "nodejs"`; keep both if you touch it.
