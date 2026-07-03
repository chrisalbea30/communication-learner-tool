import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { requireAdmin } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { SPEAKING_MODES } from "@/lib/speaking/modes";

export const metadata: Metadata = { title: "Admin · Fluent" };

// Always render fresh — this is a live monitoring view.
export const dynamic = "force-dynamic";

type UserRow = {
  username: string;
  joined: string;
  study: number;
  speaking: number;
  attempts: number;
  avg: number | null;
  last: string | null;
};

export default async function AdminPage() {
  const { name } = await requireAdmin();
  const admin = createAdminClient();

  const [profilesRes, studyRes, speakingRes, attemptsRes, analysesRes] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, username, display_username, created_at")
        .order("created_at", { ascending: true })
        .limit(1000),
      admin.from("study_sessions").select("user_id, kind, status, updated_at").limit(5000),
      admin
        .from("speaking_sessions")
        .select("id, user_id, mode, status, started_at")
        .order("started_at", { ascending: false })
        .limit(5000),
      admin.from("practice_attempts").select("user_id").limit(20000),
      admin.from("session_analyses").select("session_id, user_id, overall_score").limit(5000),
    ]);

  const profiles = profilesRes.data ?? [];
  const study = studyRes.data ?? [];
  const speaking = speakingRes.data ?? [];
  const attempts = attemptsRes.data ?? [];
  const analyses = analysesRes.data ?? [];

  // Aggregates
  const completedSpeaking = speaking.filter((s) => s.status === "completed").length;
  const allScores = analyses
    .map((a) => a.overall_score)
    .filter((n): n is number => typeof n === "number");
  const avgScore = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null;

  const byMode: Record<string, number> = { interview: 0, introduce: 0, presentation: 0 };
  for (const s of speaking) if (s.mode in byMode) byMode[s.mode] += 1;

  // Per-user rollup
  type Agg = {
    study: number;
    speaking: number;
    attempts: number;
    scores: number[];
    last: string | null;
  };
  const map = new Map<string, Agg>();
  const ensure = (id: string): Agg => {
    let r = map.get(id);
    if (!r) {
      r = { study: 0, speaking: 0, attempts: 0, scores: [], last: null };
      map.set(id, r);
    }
    return r;
  };
  const bump = (r: Agg, when: string | null) => {
    if (when && (!r.last || when > r.last)) r.last = when;
  };
  for (const s of study) {
    const r = ensure(s.user_id);
    r.study += 1;
    bump(r, s.updated_at);
  }
  for (const s of speaking) {
    const r = ensure(s.user_id);
    r.speaking += 1;
    bump(r, s.started_at);
  }
  for (const a of attempts) ensure(a.user_id).attempts += 1;
  for (const a of analyses) {
    if (typeof a.overall_score === "number") ensure(a.user_id).scores.push(a.overall_score);
  }

  const userRows: UserRow[] = profiles
    .map((p) => {
      const r = map.get(p.id);
      const scores = r?.scores ?? [];
      return {
        username: p.display_username || p.username,
        joined: p.created_at.slice(0, 10),
        study: r?.study ?? 0,
        speaking: r?.speaking ?? 0,
        attempts: r?.attempts ?? 0,
        avg: scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null,
        last: r?.last ? r.last.slice(0, 10) : null,
      };
    })
    .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));

  // Recent speaking sessions with usernames + score
  const nameById = new Map(profiles.map((p) => [p.id, p.display_username || p.username]));
  const scoreBySession = new Map(
    analyses.map((a) => [a.session_id, a.overall_score] as const),
  );
  const recent = speaking.slice(0, 12).map((s) => ({
    id: s.id,
    username: nameById.get(s.user_id) ?? "—",
    mode: s.mode,
    status: s.status,
    when: s.started_at.slice(0, 10),
    score: scoreBySession.get(s.id) ?? null,
  }));

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
      <AppHeader username={name} isAdmin />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Admin dashboard
        </h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Overview of all learners and activity across Fluent.
        </p>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Learners" value={profiles.length} />
          <Stat label="Speaking sessions" value={`${completedSpeaking}/${speaking.length}`} hint="done / total" />
          <Stat label="Study sessions" value={study.length} />
          <Stat label="Practice attempts" value={attempts.length} />
          <Stat label="Avg speaking score" value={avgScore === null ? "—" : `${avgScore}`} hint="/ 100" />
        </div>

        {/* Speaking by mode */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Speaking practice by type
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(Object.keys(byMode) as (keyof typeof SPEAKING_MODES)[]).map((m) => (
              <div
                key={m}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="text-2xl">{SPEAKING_MODES[m].emoji}</span>
                <div>
                  <div className="text-xl font-bold text-neutral-900 dark:text-white">
                    {byMode[m]}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {SPEAKING_MODES[m].title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Per-user table */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Learners
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-neutral-100 text-left text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <Th>User</Th>
                  <Th>Joined</Th>
                  <Th>Study</Th>
                  <Th>Speaking</Th>
                  <Th>Drills</Th>
                  <Th>Avg score</Th>
                  <Th>Last active</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950">
                {userRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-500" colSpan={7}>
                      No learners yet.
                    </td>
                  </tr>
                ) : (
                  userRows.map((u) => (
                    <tr key={u.username} className="text-neutral-800 dark:text-neutral-200">
                      <Td className="font-medium">{u.username}</Td>
                      <Td>{u.joined}</Td>
                      <Td>{u.study}</Td>
                      <Td>{u.speaking}</Td>
                      <Td>{u.attempts}</Td>
                      <Td>{u.avg === null ? "—" : u.avg}</Td>
                      <Td>{u.last ?? "—"}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent speaking sessions */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Recent speaking sessions
          </h2>
          <div className="mt-3 space-y-2">
            {recent.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No speaking sessions yet.
              </p>
            ) : (
              recent.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-center gap-2">
                    <span>{SPEAKING_MODES[r.mode].emoji}</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {r.username}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      · {SPEAKING_MODES[r.mode].title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
                    <span>{r.score === null ? "—" : `${r.score}/100`}</span>
                    <span
                      className={
                        r.status === "completed"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {r.status}
                    </span>
                    <span>{r.when}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-2xl font-bold text-neutral-900 dark:text-white">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        {label}
        {hint ? <span className="text-neutral-400"> ({hint})</span> : null}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-2.5 ${className}`}>{children}</td>;
}
