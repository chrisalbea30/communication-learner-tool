import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Server-side guard for authenticated pages. Redirects to /login when there is
 * no session. Returns the user, a display name, and the request-bound Supabase
 * client (reuse it for further queries so the session cookie is shared).
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_username")
    .eq("id", user.id)
    .single();

  const name =
    profile?.display_username ?? user.email?.split("@")[0] ?? "there";

  return { user, name, supabase };
}
