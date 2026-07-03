import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Username (lower-cased) allowed to access the admin area. */
export const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "admin").toLowerCase();

export function isAdminUsername(username: string | null | undefined): boolean {
  return !!username && username.toLowerCase() === ADMIN_USERNAME;
}

/**
 * Server-side guard for authenticated pages. Redirects to /login when there is
 * no session. Returns the user, a display name, the normalized username, an
 * `isAdmin` flag, and the request-bound Supabase client (reuse it for further
 * queries so the session cookie is shared).
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_username")
    .eq("id", user.id)
    .single();

  const username = profile?.username ?? "";
  const name =
    profile?.display_username ?? user.email?.split("@")[0] ?? "there";

  return { user, name, username, isAdmin: isAdminUsername(username), supabase };
}

/** Like requireUser, but redirects non-admins to their dashboard. */
export async function requireAdmin() {
  const ctx = await requireUser();
  if (!ctx.isAdmin) redirect("/dashboard");
  return ctx;
}
