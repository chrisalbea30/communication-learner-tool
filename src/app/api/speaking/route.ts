import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isSpeakingMode } from "@/lib/speaking/modes";

/** Creates a new speaking session and returns its id. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { mode?: string; config?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const mode = body.mode ?? "";
  if (!isSpeakingMode(mode)) {
    return NextResponse.json({ error: "Unknown practice mode." }, { status: 400 });
  }

  const config: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.config ?? {})) {
    if (typeof value === "string") config[key] = value.slice(0, 2000);
  }

  const { data, error } = await supabase
    .from("speaking_sessions")
    .insert({ user_id: user.id, mode, config })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not start the session." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
