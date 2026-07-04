/**
 * Seed the local /data store with realistic South African sample data so the
 * app has something to show on first run. Overwrites existing data files.
 *
 *   npm run seed
 *
 * Amounts are integer cents; shapes match src/lib/schema.ts.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (base, days) => {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

const today = new Date();
const nowIso = today.toISOString();

const settings = {
  business: {
    name: "Acme Studio",
    email: "hello@acmestudio.co.za",
    addressLine1: "12 Long Street",
    addressLine2: "",
    city: "Cape Town",
    region: "Western Cape",
    postalCode: "8001",
    country: "South Africa",
    taxId: "4123456789",
  },
  logo: "",
  defaultCurrency: "ZAR",
  defaultTerms: "net_30",
  paymentDetails: {
    bank: "FNB",
    accountType: "Cheque",
    accountNumber: "62012345678",
    branchCode: "250655",
  },
  vatRegistered: true,
  defaultTaxPercent: 15,
  defaultNotes: "Thank you for your business!",
  nextInvoiceSeq: 3,
  invoicePrefix: "INV-",
};

const globex = {
  id: randomUUID(),
  createdAt: nowIso,
  name: "Globex (Pty) Ltd",
  email: "finance@globex.co.za",
  addressLine1: "5 Rivonia Road",
  addressLine2: "",
  city: "Sandton",
  region: "Gauteng",
  postalCode: "2196",
  country: "South Africa",
  taxId: "4987654321",
};

const initech = {
  id: randomUUID(),
  createdAt: nowIso,
  name: "Initech CC",
  email: "accounts@initech.co.za",
  addressLine1: "88 Florida Road",
  addressLine2: "",
  city: "Durban",
  region: "KwaZulu-Natal",
  postalCode: "4001",
  country: "South Africa",
  taxId: "",
};

const clients = [globex, initech];

// The business profile is snapshotted onto each invoice's "from" party.
const from = { ...settings.business };

// INV-0001: sent 40 days ago on 30-day terms -> now overdue (derived).
const issue1 = addDays(today, -40);
const invoice1 = {
  id: randomUUID(),
  number: "INV-0001",
  status: "sent",
  currency: "ZAR",
  from,
  to: { ...globex },
  paymentDetails: { ...settings.paymentDetails },
  issueDate: iso(issue1),
  dueDate: iso(addDays(issue1, 30)),
  terms: "net_30",
  items: [
    { id: randomUUID(), description: "Brand identity design", quantity: 1, unitPriceCents: 2500000 },
    { id: randomUUID(), description: "Logo variations", quantity: 3, unitPriceCents: 150000 },
  ],
  discountPercent: 0,
  taxPercent: 15,
  notes: settings.defaultNotes,
  createdAt: issue1.toISOString(),
  updatedAt: issue1.toISOString(),
};

// INV-0002: draft, issued today.
const invoice2 = {
  id: randomUUID(),
  number: "INV-0002",
  status: "draft",
  currency: "ZAR",
  from,
  to: { ...initech },
  paymentDetails: { ...settings.paymentDetails },
  issueDate: iso(today),
  dueDate: iso(addDays(today, 15)),
  terms: "net_15",
  items: [
    { id: randomUUID(), description: "Website design (5 pages)", quantity: 1, unitPriceCents: 1800000 },
    { id: randomUUID(), description: "Monthly hosting & maintenance", quantity: 6, unitPriceCents: 120000 },
  ],
  discountPercent: 5,
  taxPercent: 15,
  notes: settings.defaultNotes,
  createdAt: nowIso,
  updatedAt: nowIso,
};

const invoices = [invoice1, invoice2];

await mkdir(DATA_DIR, { recursive: true });
await writeFile(path.join(DATA_DIR, "settings.json"), JSON.stringify(settings, null, 2));
await writeFile(path.join(DATA_DIR, "clients.json"), JSON.stringify(clients, null, 2));
await writeFile(path.join(DATA_DIR, "invoices.json"), JSON.stringify(invoices, null, 2));

console.log(`Seeded ${clients.length} clients and ${invoices.length} invoices into ${DATA_DIR}`);
