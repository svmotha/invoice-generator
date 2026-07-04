"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PAYMENT_TERMS, TERM_LABEL, settingsSchema, type Settings } from "@/lib/schema";
import { TextField } from "@/components/ui/TextField";

/** Form-input shape: fields with schema defaults are optional before parsing. */
type SettingsFormValues = z.input<typeof settingsSchema>;

const selectClass =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm " +
  "shadow-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 " +
  "dark:border-neutral-700 dark:bg-neutral-900";

type SaveState = { status: "idle" | "saving" | "saved" | "error"; message?: string };

export function SettingsForm({ initial }: { initial: Settings }) {
  const [save, setSave] = useState<SaveState>({ status: "idle" });
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SettingsFormValues, unknown, Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const vatRegistered = watch("vatRegistered");

  async function onSubmit(values: Settings) {
    setSave({ status: "saving" });
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setSave({ status: "saved", message: "Settings saved." });
    } catch (err) {
      setSave({ status: "error", message: (err as Error).message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Business details</h2>
        <p className="mt-1 text-sm text-neutral-500">
          These appear in the “From” section of every invoice you create.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Business name"
            placeholder="Acme Co."
            error={errors.business?.name?.message}
            {...register("business.name")}
          />
          <TextField
            label="Email"
            type="email"
            placeholder="billing@acme.co"
            error={errors.business?.email?.message}
            {...register("business.email")}
          />
          <TextField
            label="Address line 1"
            {...register("business.addressLine1")}
          />
          <TextField
            label="Address line 2"
            {...register("business.addressLine2")}
          />
          <TextField label="City" {...register("business.city")} />
          <TextField label="State / Region" {...register("business.region")} />
          <TextField label="Postal code" {...register("business.postalCode")} />
          <TextField label="Country" {...register("business.country")} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Invoice defaults</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Pre-filled on new invoices. You can override them per invoice.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Default currency (ISO code)"
            placeholder="ZAR"
            maxLength={3}
            className="uppercase"
            error={errors.defaultCurrency?.message}
            {...register("defaultCurrency")}
          />
          <label className="block">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Default payment terms
            </span>
            <select className={selectClass} {...register("defaultTerms")}>
              {PAYMENT_TERMS.map((value) => (
                <option key={value} value={value}>
                  {TERM_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Invoice number prefix"
            placeholder="INV-"
            error={errors.invoicePrefix?.message}
            {...register("invoicePrefix")}
          />
          <TextField
            label="Next invoice number"
            type="number"
            min={1}
            step={1}
            error={errors.nextInvoiceSeq?.message}
            {...register("nextInvoiceSeq", { valueAsNumber: true })}
          />
        </div>

        {/* VAT */}
        <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4" {...register("vatRegistered")} />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              My business is VAT registered
            </span>
          </label>
          <p className="mt-1 text-xs text-neutral-500">
            Only VAT-registered businesses may charge VAT. When off, new invoices default to 0% VAT.
          </p>

          {vatRegistered ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="VAT registration number"
                placeholder="4xxxxxxxxx"
                error={errors.business?.taxId?.message}
                {...register("business.taxId")}
              />
              <TextField
                label="Default VAT rate (%)"
                type="number"
                step="0.01"
                min={0}
                max={100}
                error={errors.defaultTaxPercent?.message}
                {...register("defaultTaxPercent", { valueAsNumber: true })}
              />
            </div>
          ) : null}
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Default notes
          </span>
          <textarea
            rows={3}
            className={selectClass}
            placeholder="e.g. Thank you for your business!"
            {...register("defaultNotes")}
          />
        </label>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Payment details</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Where clients pay you. These appear in a dedicated section on new invoices, so
          you no longer need to type them into the notes. The account holder (your business
          name) and reference (the invoice number) are added automatically.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Bank" placeholder="e.g. FNB" {...register("paymentDetails.bank")} />
          <TextField
            label="Account type"
            placeholder="e.g. Cheque / Current"
            {...register("paymentDetails.accountType")}
          />
          <TextField
            label="Account number"
            {...register("paymentDetails.accountNumber")}
          />
          <TextField label="Branch code" {...register("paymentDetails.branchCode")} />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={save.status === "saving"}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {save.status === "saving" ? "Saving…" : "Save settings"}
        </button>
        {save.message ? (
          <span
            className={`text-sm ${
              save.status === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {save.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
