import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth/current-user";
import { VocabPractice } from "./vocab-practice";

export const metadata: Metadata = { title: "Vocabulary · Fluent" };

export default async function VocabPage() {
  const { user, name, supabase } = await requireUser();

  const { data: session } = await supabase
    .from("study_sessions")
    .select("id, progress")
    .eq("user_id", user.id)
    .eq("kind", "vocab")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initialSession = session
    ? { id: session.id, progress: (session.progress ?? {}) as { index?: number; score?: number } }
    : null;

  return (
    <PageShell
      username={name}
      title="Vocabulary practice"
      subtitle="Choose the correct meaning for each word."
    >
      <VocabPractice userId={user.id} initialSession={initialSession} />
    </PageShell>
  );
}
