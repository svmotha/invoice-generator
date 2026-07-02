import type { InputHTMLAttributes, ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  error?: string;
}

const baseInput =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm " +
  "shadow-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 " +
  "dark:border-neutral-700 dark:bg-neutral-900";

/** Labeled text input with inline validation message. */
export function TextField({ label, error, className, ...props }: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
      <input className={`${baseInput} ${className ?? ""}`} {...props} />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
