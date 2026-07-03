import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { LinkButton } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  MODE_BY_SLUG,
  PRACTICE_MODES,
  type PracticeMode,
} from "@/lib/practice-modes";

export const metadata: Metadata = { title: "Dashboard · Fluent" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: activeSession }] = await Promise.all([
    supabase.from("profiles").select("display_username").eq("id", user.id).single(),
    supabase
      .from("study_sessions")
      .select("id, kind, title, updated_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const name = profile?.display_username ?? user.email?.split("@")[0] ?? "there";
  const resumeMode = activeSession ? MODE_BY_SLUG[activeSession.kind] : null;

  const speaking = PRACTICE_MODES.filter((m) => m.category === "speaking");
  const drills = PRACTICE_MODES.filter((m) => m.category === "drill");

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
      <AppHeader username={name} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Welcome back, {name} 👋
        </h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Ready to keep building your English fluency?
        </p>

        {resumeMode && activeSession ? (
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 sm:flex-row sm:items-center dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-violet-950/40">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                Continue where you left off
              </span>
              <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
                {activeSession.title ?? resumeMode.title}
              </p>
            </div>
            <LinkButton href={`${resumeMode.href}?session=${activeSession.id}`} size="lg">
              Continue →
            </LinkButton>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
            <p className="text-neutral-600 dark:text-neutral-300">
              No session in progress. Pick a practice below to start learning.
            </p>
          </div>
        )}

        <Section title="Speaking practice" caption="The core of Fluent — speak, converse, and get reviewed.">
          {speaking.map((m) => (
            <ModeCard key={m.slug} mode={m} />
          ))}
        </Section>

        <Section title="Drills" caption="Quick daily reps for words and writing.">
          {drills.map((m) => (
            <ModeCard key={m.slug} mode={m} />
          ))}
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
        {title}
      </h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{caption}</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function ModeCard({ mode }: { mode: PracticeMode }) {
  return (
    <Link
      href={mode.href}
      className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${mode.accent} text-xl text-white shadow-sm`}
      >
        {mode.emoji}
      </div>
      <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
        {mode.title}
      </h3>
      <p className="mt-1 flex-1 text-sm text-neutral-500 dark:text-neutral-400">
        {mode.blurb}
      </p>
      <span className="mt-4 text-sm font-medium text-indigo-600 group-hover:underline dark:text-indigo-400">
        Start →
      </span>
    </Link>
  );
}
