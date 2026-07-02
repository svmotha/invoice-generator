"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { partySchema, type Client, type Party } from "@/lib/schema";
import { TextField } from "@/components/ui/TextField";

type PartyInput = z.input<typeof partySchema>;

const emptyParty: Party = {
  name: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  taxId: "",
};

export function ClientsManager({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartyInput, unknown, Party>({
    resolver: zodResolver(partySchema),
    defaultValues: emptyParty,
  });

  function startEdit(client: Client) {
    setEditingId(client.id);
    setError(null);
    reset(client);
  }

  function cancel() {
    setEditingId(null);
    setError(null);
    reset(emptyParty);
  }

  async function onSubmit(values: Party) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        editingId ? `/api/clients/${editingId}` : "/api/clients",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      cancel();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      if (editingId === id) cancel();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
      {/* List */}
      <div>
        {clients.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
            No clients yet. Add one on the right to reuse it on invoices.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {clients.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium">{c.name}</div>
                  <div className="truncate text-sm text-neutral-500">
                    {[c.email, c.city, c.country].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => del(c.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form */}
      <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">{editingId ? "Edit client" : "Add client"}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          <TextField label="Name" error={errors.name?.message} {...register("name")} />
          <TextField label="Email" type="email" {...register("email")} />
          <TextField label="Address line 1" {...register("addressLine1")} />
          <TextField label="Address line 2" {...register("addressLine2")} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="City" {...register("city")} />
            <TextField label="Region" {...register("region")} />
            <TextField label="Postal code" {...register("postalCode")} />
            <TextField label="Country" {...register("country")} />
          </div>
          <TextField label="VAT / Tax ID" {...register("taxId")} />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {busy ? "Saving…" : editingId ? "Save changes" : "Add client"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={cancel}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </aside>
    </div>
  );
}
