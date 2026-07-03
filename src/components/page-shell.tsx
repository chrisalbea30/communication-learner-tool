import Link from "next/link";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";

export function PageShell({
  username,
  title,
  subtitle,
  backHref = "/dashboard",
  backLabel = "Dashboard",
  children,
}: {
  username: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
      <AppHeader username={username} />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href={backHref}
          className="text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          ← {backLabel}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
