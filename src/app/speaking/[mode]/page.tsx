import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/page-shell";
import { SetupForm } from "@/components/speaking/setup-form";
import { requireUser } from "@/lib/auth/current-user";
import { SPEAKING_MODES, isSpeakingMode } from "@/lib/speaking/modes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mode: string }>;
}): Promise<Metadata> {
  const { mode } = await params;
  const title = isSpeakingMode(mode) ? SPEAKING_MODES[mode].title : "Speaking";
  return { title: `${title} · Fluent` };
}

export default async function SpeakingSetupPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  if (!isSpeakingMode(mode)) notFound();

  const { name } = await requireUser();
  const meta = SPEAKING_MODES[mode];

  return (
    <PageShell username={name} title={meta.title} subtitle={meta.tagline}>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <SetupForm mode={meta} />
      </div>
    </PageShell>
  );
}
