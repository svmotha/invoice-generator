import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  clientSchema,
  invoiceSchema,
  settingsSchema,
  type Client,
  type Invoice,
  type Settings,
} from "./schema";

/**
 * v1 persistence: plain JSON files under /data at the project root. This module
 * is server-only (uses fs) — import it from API routes or server components,
 * never from client components. The public API here is intentionally the same
 * shape we'd expose over a database, so a later swap to SQLite is localized.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/** Read and JSON-parse a file, returning `fallback` if it doesn't exist yet. */
async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

/** Serialize and atomically write JSON (write temp, then rename). */
async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDataDir();
  const tmp = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/**
 * Default business profile used before the owner has saved settings. Built as a
 * literal (not parsed) because the placeholder empty business name is
 * intentionally invalid per the schema — the UI prompts the owner to fill it in.
 */
function defaultSettings(): Settings {
  return {
    business: {
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
    logo: "",
    defaultCurrency: "USD",
    defaultTerms: "net_30",
    defaultTaxPercent: 0,
    defaultNotes: "",
    nextInvoiceSeq: 1,
    invoicePrefix: "INV-",
  };
}

export async function getSettings(): Promise<Settings> {
  const raw = await readJson<unknown>(SETTINGS_FILE, null);
  if (raw === null) return defaultSettings();
  // Re-parse so older files gain any newly-added defaulted fields.
  return settingsSchema.parse(raw);
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const parsed = settingsSchema.parse(settings);
  await writeJson(SETTINGS_FILE, parsed);
  return parsed;
}

/**
 * Reserve and return the next invoice number (e.g. "INV-0001"), incrementing
 * the stored sequence. Kept here so numbering stays consistent with settings.
 */
export async function nextInvoiceNumber(): Promise<string> {
  const settings = await getSettings();
  const seq = settings.nextInvoiceSeq;
  const number = `${settings.invoicePrefix}${String(seq).padStart(4, "0")}`;
  await saveSettings({ ...settings, nextInvoiceSeq: seq + 1 });
  return number;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export async function listClients(): Promise<Client[]> {
  return readJson<Client[]>(CLIENTS_FILE, []);
}

export async function getClient(id: string): Promise<Client | null> {
  const clients = await listClients();
  return clients.find((c) => c.id === id) ?? null;
}

/** Create or update a client. Pass an `id` to update, omit it to create. */
export async function saveClient(
  input: Partial<Client> & { name: string }
): Promise<Client> {
  const clients = await listClients();
  if (input.id) {
    const idx = clients.findIndex((c) => c.id === input.id);
    if (idx === -1) throw new Error(`Client ${input.id} not found`);
    const updated = clientSchema.parse({ ...clients[idx], ...input });
    clients[idx] = updated;
    await writeJson(CLIENTS_FILE, clients);
    return updated;
  }
  const created = clientSchema.parse({
    ...input,
    id: randomUUID(),
    createdAt: nowIso(),
  });
  clients.push(created);
  await writeJson(CLIENTS_FILE, clients);
  return created;
}

export async function deleteClient(id: string): Promise<void> {
  const clients = await listClients();
  await writeJson(
    CLIENTS_FILE,
    clients.filter((c) => c.id !== id)
  );
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export async function listInvoices(): Promise<Invoice[]> {
  const invoices = await readJson<Invoice[]>(INVOICES_FILE, []);
  // Newest first.
  return invoices.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const invoices = await readJson<Invoice[]>(INVOICES_FILE, []);
  return invoices.find((i) => i.id === id) ?? null;
}

export async function saveInvoice(invoice: Invoice): Promise<Invoice> {
  const parsed = invoiceSchema.parse({ ...invoice, updatedAt: nowIso() });
  const invoices = await readJson<Invoice[]>(INVOICES_FILE, []);
  const idx = invoices.findIndex((i) => i.id === parsed.id);
  if (idx === -1) invoices.push(parsed);
  else invoices[idx] = parsed;
  await writeJson(INVOICES_FILE, invoices);
  return parsed;
}

export async function deleteInvoice(id: string): Promise<void> {
  const invoices = await readJson<Invoice[]>(INVOICES_FILE, []);
  await writeJson(
    INVOICES_FILE,
    invoices.filter((i) => i.id !== id)
  );
}
