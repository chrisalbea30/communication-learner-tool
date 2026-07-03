import { createClient } from "@/lib/supabase/client";
import type { Json, StudyKind } from "@/lib/types/database";

/**
 * Browser-side helpers to persist practice progress. All writes go through the
 * anon client and are constrained by row-level security (a user can only write
 * their own rows). Failures are non-fatal — practice UX should never block on
 * a write, so callers can ignore rejections.
 */

export async function createStudySession(
  userId: string,
  kind: StudyKind,
  title: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_sessions")
    .insert({ user_id: userId, kind, title })
    .select("id")
    .single();
  if (error) return null;
  return data.id;
}

export async function updateSessionProgress(
  sessionId: string,
  progress: Record<string, Json>,
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("study_sessions")
    .update({ progress })
    .eq("id", sessionId);
}

export async function completeSession(sessionId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("study_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function logAttempt(input: {
  userId: string;
  sessionId: string | null;
  kind: "vocab" | "typing";
  prompt: Json;
  response: Json;
  isCorrect?: boolean | null;
  score?: number | null;
}): Promise<void> {
  const supabase = createClient();
  await supabase.from("practice_attempts").insert({
    user_id: input.userId,
    session_id: input.sessionId,
    kind: input.kind,
    prompt: input.prompt,
    response: input.response,
    is_correct: input.isCorrect ?? null,
    score: input.score ?? null,
  });
}
