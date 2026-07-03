import { notFound, redirect } from "next/navigation";

import { PageShell } from "@/components/page-shell";
import { SpeakingRoom } from "@/components/speaking/speaking-room";
import { requireUser } from "@/lib/auth/current-user";
import { SPEAKING_MODES, isSpeakingMode } from "@/lib/speaking/modes";

export default async function SpeakingRoomPage({
  params,
}: {
  params: Promise<{ mode: string; sessionId: string }>;
}) {
  const { mode, sessionId } = await params;
  if (!isSpeakingMode(mode)) notFound();

  const { user, name, supabase } = await requireUser();

  const { data: session } = await supabase
    .from("speaking_sessions")
    .select("id, mode, status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session || session.mode !== mode) notFound();
  if (session.status === "completed") {
    redirect(`/speaking/${mode}/${sessionId}/review`);
  }

  const { data: turns } = await supabase
    .from("speaking_turns")
    .select("role, content, seq")
    .eq("session_id", sessionId)
    .order("seq", { ascending: true });

  const initialTurns = (turns ?? []).map((t) => ({
    role: t.role,
    content: t.content,
  }));

  const meta = SPEAKING_MODES[mode];

  return (
    <PageShell
      username={name}
      title={meta.title}
      backHref={`/speaking/${mode}`}
      backLabel="Setup"
    >
      <SpeakingRoom sessionId={sessionId} mode={meta} initialTurns={initialTurns} />
    </PageShell>
  );
}
