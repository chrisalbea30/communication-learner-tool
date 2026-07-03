import Link from "next/link";
import type { ReactNode } from "react";

const HIGHLIGHTS = [
  "Practice real job interviews with an AI interviewer",
  "Rehearse your self-introduction and client presentations",
  "Get an honest after-action review: what worked, what to fix",
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand / value panel */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-black/10 blur-3xl" />
        <Link href="/" className="relative z-10 text-lg font-semibold tracking-tight">
          🗣️ Fluent
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Speak English with confidence.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm">
                  ✓
                </span>
                <span className="text-white/90">{h}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-sm text-white/70">
          Your AI communication coach.
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-white px-6 py-12 dark:bg-neutral-950">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-block text-lg font-semibold tracking-tight text-neutral-900 lg:hidden dark:text-white"
          >
            🗣️ Fluent
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-1.5 mb-8 text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </p>
          {children}
        </div>
      </section>
    </main>
  );
}
