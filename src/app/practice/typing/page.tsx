import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth/current-user";
import { TypingPractice } from "./typing-practice";

export const metadata: Metadata = { title: "Typing · Fluent" };

export default async function TypingPage() {
  const { user, name, supabase } = await requireUser();

  const { data: session } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", "typing")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <PageShell
      username={name}
      title="Typing & writing practice"
      subtitle="Type each sentence exactly. We'll track your accuracy and speed."
    >
      <TypingPractice userId={user.id} initialSessionId={session?.id ?? null} />
    </PageShell>
  );
}
