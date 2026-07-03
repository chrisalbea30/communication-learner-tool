import { NextResponse } from "next/server";
import type OpenAI from "openai";

import { createClient } from "@/lib/supabase/server";
import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";
import { isSpeakingMode } from "@/lib/speaking/modes";
import { buildSystemPrompt } from "@/lib/speaking/prompts";

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

/**
 * Advances a speaking session by one turn. Pass `userText` for the learner's
 * reply, or omit it on the very first call to get the AI's opening line.
 * Persists both the learner turn (if any) and the AI reply.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string; userText?: string };
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
    .select("id, mode, config")
    .eq("id", sessionId)
    .single();
  if (!session || !isSpeakingMode(session.mode)) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const [{ data: turns }, { data: profile }] = await Promise.all([
    supabase
      .from("speaking_turns")
      .select("role, content, seq")
      .eq("session_id", sessionId)
      .order("seq", { ascending: true }),
    supabase.from("profiles").select("display_username").eq("id", user.id).single(),
  ]);

  const history = turns ?? [];
  const name = profile?.display_username ?? "there";
  const config = (session.config ?? {}) as Record<string, string>;
  const userText = (body.userText ?? "").trim();

  const messages: Msg[] = [
    { role: "system", content: buildSystemPrompt(session.mode, config, name) },
  ];
  for (const t of history) {
    if (t.role === "assistant") messages.push({ role: "assistant", content: t.content });
    else messages.push({ role: "user", content: t.content });
  }
  if (userText) {
    messages.push({ role: "user", content: userText });
  } else if (history.length === 0) {
    messages.push({
      role: "user",
      content: "[The session is starting now. Please greet me and begin.]",
    });
  } else {
    return NextResponse.json({ error: "Nothing to respond to." }, { status: 400 });
  }

  let reply = "";
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.8,
      max_tokens: 220,
      messages,
    });
    reply = completion.choices[0]?.message?.content?.trim() ?? "";
  } catch {
    return NextResponse.json(
      { error: "The AI interviewer is unavailable right now." },
      { status: 502 },
    );
  }
  if (!reply) {
    return NextResponse.json({ error: "Empty response from the AI." }, { status: 502 });
  }

  let seq = history.length;
  const rows: {
    session_id: string;
    user_id: string;
    role: "user" | "assistant";
    content: string;
    seq: number;
  }[] = [];
  if (userText) {
    rows.push({ session_id: sessionId, user_id: user.id, role: "user", content: userText, seq });
    seq += 1;
  }
  rows.push({ session_id: sessionId, user_id: user.id, role: "assistant", content: reply, seq });
  await supabase.from("speaking_turns").insert(rows);

  return NextResponse.json({ reply, seq });
}
