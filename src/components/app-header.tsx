import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";

export function AppHeader({ username }: { username: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white"
        >
          🗣️ Fluent
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-neutral-500 sm:inline dark:text-neutral-400">
            @{username}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
