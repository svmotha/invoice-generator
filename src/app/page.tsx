import Link from "next/link";
import { getSettings } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();
  const needsSetup = !settings.business.name;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <Link
          href="/invoices/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          New invoice
        </Link>
      </div>

      {needsSetup ? (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
          Finish setting up your{" "}
          <Link href="/settings" className="font-medium underline">
            business details
          </Link>{" "}
          so they appear on your invoices.
        </div>
      ) : null}

      <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
        No invoices yet. The invoice builder lands in the next step.
      </div>
    </div>
  );
}
