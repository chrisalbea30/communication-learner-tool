import { redirect } from "next/navigation";

import { LinkButton } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { PRACTICE_MODES } from "@/lib/practice-modes";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">🗣️ Fluent</span>
        <div className="flex items-center gap-2">
          <LinkButton href="/login" variant="ghost" size="sm">
            Sign in
          </LinkButton>
          <LinkButton href="/signup" size="sm">
            Get started
          </LinkButton>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-5 inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          Your AI English communication coach
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-white">
          Learn to communicate in English{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
            fluently
          </span>
          .
        </h1>
        <p className="mt-5 max-w-xl text-lg text-neutral-600 dark:text-neutral-300">
          Practice speaking through real scenarios — mock interviews,
          self-introductions, and client presentations — then get an AI review
          of exactly what to improve.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/signup" size="lg">
            Start learning free
          </LinkButton>
          <LinkButton href="/login" variant="secondary" size="lg">
            I already have an account
          </LinkButton>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {PRACTICE_MODES.filter((m) => m.category === "speaking").map((m) => (
            <div
              key={m.slug}
              className="rounded-2xl border border-neutral-200 bg-white p-5 text-left dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="text-2xl">{m.emoji}</div>
              <h3 className="mt-3 font-semibold text-neutral-900 dark:text-white">
                {m.title}
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {m.blurb}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
