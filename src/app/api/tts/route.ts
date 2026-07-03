import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const ELEVEN_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

/** Proxies ElevenLabs text-to-speech so the API key never reaches the browser. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey.startsWith("YOUR-")) {
    return NextResponse.json(
      { error: "Voice is not configured. Add ELEVENLABS_API_KEY to .env.local." },
      { status: 500 },
    );
  }

  let body: { text?: string; voiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "No text to speak." }, { status: 400 });
  }

  const voiceId =
    body.voiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";

  const upstream = await fetch(`${ELEVEN_BASE}/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: text.slice(0, 5000),
      model_id: modelId,
      voice_settings: { stability: 0.4, similarity_boost: 0.75 },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: "Voice generation failed.", detail: detail.slice(0, 300) },
      { status: 502 },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
