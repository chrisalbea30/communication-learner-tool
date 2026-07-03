import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/page-shell";
import { AnalysisView } from "@/components/speaking/analysis-view";
import { AnalyzeTrigger } from "@/components/speaking/analyze-trigger";
import { requireUser } from "@/lib/auth/current-user";
import { SPEAKING_MODES, isSpeakingMode } from "@/lib/speaking/modes";
import { normalizeAnalysis } from "@/lib/speaking/prompts";

export const metadata: Metadata = { title: "Review · Fluent" };

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ mode: string; sessionId: string }>;
}) {
  const { mode, sessionId } = await params;
  if (!isSpeakingMode(mode)) notFound();

  const { user, name, supabase } = await requireUser();

  const { data: session } = await supabase
    .from("speaking_sessions")
    .select("id, mode")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!session || session.mode !== mode) notFound();

  const [{ data: analysisRow }, { data: turns }] = await Promise.all([
    supabase
      .from("session_analyses")
      .select("overall_score, summary, metrics, strengths, improvements, highlights")
      .eq("session_id", sessionId)
      .maybeSingle(),
    supabase
      .from("speaking_turns")
      .select("role, content, seq")
      .eq("session_id", sessionId)
      .order("seq", { ascending: true }),
  ]);

  const meta = SPEAKING_MODES[mode];
  const transcript = (turns ?? []).map((t) => ({
    role: t.role,
    content: t.content,
  }));

  return (
    <PageShell
      username={name}
      title={`${meta.title} — Review`}
      backHref="/dashboard"
    >
      {analysisRow ? (
        <AnalysisView analysis={normalizeAnalysis(analysisRow)} turns={transcript} />
      ) : (
        <AnalyzeTrigger sessionId={sessionId} />
      )}
    </PageShell>
  );
}
