import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  usernameToEmail,
  validatePassword,
  validateUsername,
} from "@/lib/auth/username";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const usernameCheck = validateUsername(body.username ?? "");
  if (!usernameCheck.ok) {
    return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
  }
  const passwordCheck = validatePassword(body.password ?? "");
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  const username = usernameCheck.value;
  const displayUsername = (body.username ?? "").trim();
  const password = passwordCheck.value;
  const email = usernameToEmail(username);

  const admin = createAdminClient();

  // Friendly duplicate-username error before we attempt to create the user.
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 },
    );
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no email is ever sent; mark confirmed so login works
    user_metadata: { username, display_username: displayUsername },
  });

  if (createError) {
    const alreadyExists =
      createError.status === 422 ||
      /already|exist|registered/i.test(createError.message);
    return NextResponse.json(
      {
        error: alreadyExists
          ? "That username is already taken."
          : "Could not create your account. Please try again.",
      },
      { status: alreadyExists ? 409 : 500 },
    );
  }

  // Establish the session (sets auth cookies on the response).
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return NextResponse.json(
      { error: "Account created, but sign-in failed. Try logging in." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
