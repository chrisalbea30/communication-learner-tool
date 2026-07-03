import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";
import { isSpeakingMode } from "@/lib/speaking/modes";
import { analysisSystemPrompt, normalizeAnalysis } from "@/lib/speaking/prompts";

/**
 * Runs a post-session analysis: transcript -> OpenAI -> structured review.
 * Saves the result to session_analyses and marks the session completed.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const sessionId = body.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("speaking_sessions")
    .select("id, mode")
    .eq("id", sessionId)
    .single();
  if (!session || !isSpeakingMode(session.mode)) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const { data: turns } = await supabase
    .from("speaking_turns")
    .select("role, content, seq")
    .eq("session_id", sessionId)
    .order("seq", { ascending: true });

  const rows = turns ?? [];
  if (!rows.some((t) => t.role === "user")) {
    return NextResponse.json(
      { error: "Speak at least once before ending the session." },
      { status: 400 },
    );
  }

  const transcript = rows
    .map((t) => `${t.role === "user" ? "Learner" : "AI"}: ${t.content}`)
    .join("\n");

  let parsed: unknown;
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: analysisSystemPrompt(session.mode) },
        {
          role: "user",
          content: `Here is the transcript. Return the analysis as JSON.\n\n${transcript}`,
        },
      ],
    });
    parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch {
    return NextResponse.json({ error: "Could not generate the review." }, { status: 502 });
  }

  const analysis = normalizeAnalysis(parsed);

  await supabase.from("session_analyses").upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      overall_score: analysis.overall_score,
      summary: analysis.summary,
      metrics: analysis.metrics,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      highlights: analysis.highlights,
    },
    { onConflict: "session_id" },
  );

  await supabase
    .from("speaking_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  return NextResponse.json({ analysis });
}
