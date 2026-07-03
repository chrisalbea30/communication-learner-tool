import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type FieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
};

export function Field({ label, hint, id, className, ...props }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
      <input
        id={id}
        className={cn(
          "w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
          className,
        )}
        {...props}
      />
      {hint ? (
        <span className="mt-1.5 block text-xs text-neutral-500 dark:text-neutral-400">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
