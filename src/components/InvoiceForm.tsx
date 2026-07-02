"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  builderSchema,
  emptyItem,
  toInvoiceInput,
  type BuilderInput,
  type BuilderValues,
} from "@/lib/invoiceForm";
import {
  dueDateFromTerms,
  type Client,
  type InvoiceStatus,
  type Party,
  type PaymentTerms,
} from "@/lib/schema";
import { computeTotals, formatMoney, toCents } from "@/lib/money";
import { TextField } from "@/components/ui/TextField";

const TERMS_OPTIONS: { value: PaymentTerms; label: string }[] = [
  { value: "due_on_receipt", label: "Due on receipt" },
  { value: "net_7", label: "Net 7" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_60", label: "Net 60" },
];

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm " +
  "outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 " +
  "dark:border-neutral-700 dark:bg-neutral-900";

type SubmitState = { status: "idle" | "saving" | "error"; message?: string };

export interface InvoiceFormProps {
  /** Business "from" party, snapshotted onto the invoice at save time. */
  from: Party;
  defaults: BuilderValues;
  /** Saved clients offered in the "Bill to" picker. */
  clients?: Client[];
  /** When set, the form edits this invoice (PUT) instead of creating one. */
  invoiceId?: string;
  /** Existing status, preserved when editing. */
  status?: InvoiceStatus;
}

export function InvoiceForm({
  from,
  defaults,
  clients = [],
  invoiceId,
  status = "draft",
}: InvoiceFormProps) {
  const router = useRouter();
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const isEdit = Boolean(invoiceId);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BuilderInput, unknown, BuilderValues>({
    resolver: zodResolver(builderSchema),
    defaultValues: defaults,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Keep the due date in sync when terms or issue date change. This watch
  // subscription is react-hook-form's documented pattern; the lint rule flags
  // any watch() in an effect, which is a false positive here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const sub = watch((value, { name }) => {
      if ((name === "terms" || name === "issueDate") && value.issueDate && value.terms) {
        setValue("dueDate", dueDateFromTerms(value.issueDate, value.terms));
      }
    });
    return () => sub.unsubscribe();
  }, [watch, setValue]);

  // Live totals — recompute from watched items/discount/tax.
  const watchedItems = watch("items");
  const discountPercent = watch("discountPercent");
  const taxPercent = watch("taxPercent");
  const currency = watch("currency") || "USD";

  const totals = useMemo(() => {
    const items = (watchedItems ?? []).map((item) => ({
      quantity: Number(item.quantity) || 0,
      unitPriceCents: toCents(item.unitPrice ?? 0),
    }));
    return computeTotals({
      items,
      discountPercent: Number(discountPercent) || 0,
      taxPercent: Number(taxPercent) || 0,
    });
  }, [watchedItems, discountPercent, taxPercent]);

  const money = (cents: number) => formatMoney(cents, currency);

  async function onSubmit(values: BuilderValues) {
    setSubmit({ status: "saving" });
    try {
      const res = await fetch(isEdit ? `/api/invoices/${invoiceId}` : "/api/invoices", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toInvoiceInput(values, from, status)),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      const saved = await res.json();
      router.push(isEdit ? `/invoices/${invoiceId}` : `/invoices/${saved.id}`);
      router.refresh();
    } catch (err) {
      setSubmit({ status: "error", message: (err as Error).message });
    }
  }

  /** Fill the "Bill to" fields from a saved client. */
  function applyClient(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setValue("to.name", client.name);
    setValue("to.email", client.email ?? "");
    setValue("to.addressLine1", client.addressLine1 ?? "");
    setValue("to.addressLine2", client.addressLine2 ?? "");
    setValue("to.city", client.city ?? "");
    setValue("to.region", client.region ?? "");
    setValue("to.postalCode", client.postalCode ?? "");
    setValue("to.country", client.country ?? "");
    setValue("to.taxId", client.taxId ?? "");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-8">
        {/* Bill to */}
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Bill to</h2>
            {clients.length > 0 ? (
              <select
                aria-label="Use a saved client"
                defaultValue=""
                onChange={(e) => applyClient(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="" disabled>
                  Use a saved client…
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Client name" error={errors.to?.name?.message} {...register("to.name")} />
            <TextField label="Email" type="email" {...register("to.email")} />
            <TextField label="Address line 1" {...register("to.addressLine1")} />
            <TextField label="Address line 2" {...register("to.addressLine2")} />
            <TextField label="City" {...register("to.city")} />
            <TextField label="State / Region" {...register("to.region")} />
            <TextField label="Postal code" {...register("to.postalCode")} />
            <TextField label="Country" {...register("to.country")} />
          </div>
        </section>

        {/* Meta */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Terms</span>
            <select className={`mt-1 ${inputClass}`} {...register("terms")}>
              {TERMS_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <TextField label="Issue date" type="date" error={errors.issueDate?.message} {...register("issueDate")} />
          <TextField label="Due date" type="date" error={errors.dueDate?.message} {...register("dueDate")} />
          <TextField label="Currency" maxLength={3} className="uppercase" error={errors.currency?.message} {...register("currency")} />
        </section>

        {/* Line items */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Line items</h2>
            <button
              type="button"
              onClick={() => append(emptyItem())}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              + Add item
            </button>
          </div>
          {errors.items?.message ? (
            <p className="mt-2 text-xs text-red-600">{errors.items.message}</p>
          ) : null}

          <div className="mt-4 space-y-3">
            {fields.map((field, index) => {
              const qty = Number(watchedItems?.[index]?.quantity) || 0;
              const price = toCents(watchedItems?.[index]?.unitPrice ?? 0);
              const lineTotal = Math.round(qty * price);
              return (
                <div key={field.id} className="grid grid-cols-[1fr_5rem_7rem_6rem_2rem] items-start gap-2">
                  <div>
                    <input
                      className={inputClass}
                      placeholder="Description"
                      {...register(`items.${index}.description` as const)}
                    />
                    {errors.items?.[index]?.description ? (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.items[index]?.description?.message}
                      </p>
                    ) : null}
                  </div>
                  <input
                    className={inputClass}
                    type="number"
                    step="any"
                    min={0}
                    placeholder="Qty"
                    {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                  />
                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Unit price"
                    {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                  />
                  <div className="px-1 py-2 text-right text-sm tabular-nums">{money(lineTotal)}</div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label="Remove item"
                    className="py-2 text-neutral-400 hover:text-red-600 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Notes */}
        <section>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Notes / payment instructions
            </span>
            <textarea rows={3} className={`mt-1 ${inputClass}`} {...register("notes")} />
          </label>
        </section>
      </div>

      {/* Summary sidebar */}
      <aside className="lg:sticky lg:top-8 h-fit space-y-4 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="text-sm">
          <div className="font-medium text-neutral-500">From</div>
          <div className="mt-1 font-medium">{from.name || "— set in Settings —"}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-medium text-neutral-500">Discount %</span>
            <input
              type="number" step="0.01" min={0} max={100}
              className={`mt-1 ${inputClass}`}
              {...register("discountPercent", { valueAsNumber: true })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-neutral-500">VAT %</span>
            <input
              type="number" step="0.01" min={0} max={100}
              className={`mt-1 ${inputClass}`}
              {...register("taxPercent", { valueAsNumber: true })}
            />
          </label>
        </div>

        <dl className="space-y-1 border-t border-neutral-200 pt-4 text-sm tabular-nums dark:border-neutral-800">
          <Row label="Subtotal" value={money(totals.subtotalCents)} />
          {totals.discountCents > 0 ? (
            <Row label={`Discount (${discountPercent || 0}%)`} value={`− ${money(totals.discountCents)}`} />
          ) : null}
          {totals.taxCents > 0 ? (
            <Row label={`VAT (${taxPercent || 0}%)`} value={money(totals.taxCents)} />
          ) : null}
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold dark:border-neutral-800">
            <dt>Total</dt>
            <dd>{money(totals.totalCents)}</dd>
          </div>
        </dl>

        <button
          type="submit"
          disabled={submit.status === "saving"}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {submit.status === "saving"
            ? "Saving…"
            : isEdit
            ? "Save changes"
            : "Create invoice"}
        </button>
        {submit.message ? <p className="text-sm text-red-600">{submit.message}</p> : null}
      </aside>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
