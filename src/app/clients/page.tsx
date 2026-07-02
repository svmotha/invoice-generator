import { ClientsManager } from "@/components/ClientsManager";
import { listClients } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Saved clients you can reuse when creating invoices.
      </p>
      <div className="mt-8">
        <ClientsManager clients={clients} />
      </div>
    </div>
  );
}
