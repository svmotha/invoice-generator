import { listClients } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Saved clients you can reuse across invoices.
      </p>

      {clients.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No clients yet. Client management arrives with the invoice builder.
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 dark:divide-neutral-800">
          {clients.map((c) => (
            <li key={c.id} className="py-3">
              <span className="font-medium">{c.name}</span>
              {c.email ? (
                <span className="ml-2 text-sm text-neutral-500">{c.email}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
