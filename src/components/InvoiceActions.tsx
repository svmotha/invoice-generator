"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Invoice, InvoiceStatus } from "@/lib/schema";

const btn =
  "rounded-md border border-neutral-300 px-3 py-2 font-medium hover:bg-neutral-100 " +
  "disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800";

/** Status transitions offered from the current stored status. */
const NEXT_ACTIONS: Record<InvoiceStatus, { to: InvoiceStatus; label: string }[]> = {
  draft: [{ to: "sent", label: "Mark as sent" }],
  sent: [
    { to: "paid", label: "Mark as paid" },
    { to: "draft", label: "Revert to draft" },
  ],
  overdue: [
    { to: "paid", label: "Mark as paid" },
    { to: "draft", label: "Revert to draft" },
  ],
  paid: [{ to: "sent", label: "Reopen (mark unpaid)" }],
};

export function InvoiceActions({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: InvoiceStatus) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...invoice, status }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  // Actions are keyed off the stored status (overdue is derived from "sent").
  const actions = NEXT_ACTIONS[invoice.status];

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {actions.map((a) => (
        <button key={a.to} type="button" disabled={busy} onClick={() => setStatus(a.to)} className={btn}>
          {a.label}
        </button>
      ))}

      <Link href={`/invoices/${invoice.id}/edit`} className={btn}>
        Edit
      </Link>

      {confirmDelete ? (
        <span className="flex items-center gap-2">
          <span className="text-neutral-500">Delete this invoice?</span>
          <button
            type="button"
            disabled={busy}
            onClick={del}
            className="rounded-md bg-red-600 px-3 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm delete
          </button>
          <button type="button" onClick={() => setConfirmDelete(false)} className={btn}>
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="rounded-md border border-red-300 px-3 py-2 font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
        >
          Delete
        </button>
      )}

      {error ? <span className="text-red-600">{error}</span> : null}
    </div>
  );
}
