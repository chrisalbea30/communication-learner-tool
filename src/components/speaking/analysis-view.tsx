import { LinkButton } from "@/components/ui/button";
import {
  METRIC_LABELS,
  type AnalysisMetrics,
  type AnalysisResult,
} from "@/lib/speaking/modes";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; content: string };

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function barColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export function AnalysisView({
  analysis,
  turns,
}: {
  analysis: AnalysisResult;
  turns: Turn[];
}) {
  return (
    <div className="space-y-6">
      {/* Overall */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={cn("text-5xl font-bold", scoreColor(analysis.overall_score))}>
              {analysis.overall_score}
            </div>
            <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              / 100
            </div>
          </div>
          <p className="flex-1 text-neutral-700 dark:text-neutral-200">
            {analysis.summary}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(Object.keys(METRIC_LABELS) as (keyof AnalysisMetrics)[]).map((key) => {
            const value = analysis.metrics[key];
            return (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>{METRIC_LABELS[key]}</span>
                  <span>{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div
                    className={cn("h-full rounded-full", barColor(value))}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths + Improvements */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="What went well" tone="good">
          {analysis.strengths.map((s, i) => (
            <li key={i}>
              <span className="font-medium text-neutral-900 dark:text-white">
                {s.title}.
              </span>{" "}
              {s.detail}
            </li>
          ))}
        </Panel>
        <Panel title="Where to improve" tone="warn">
          {analysis.improvements.map((s, i) => (
            <li key={i}>
              <span className="font-medium text-neutral-900 dark:text-white">
                {s.title}.
              </span>{" "}
              {s.detail}
              {s.example ? (
                <span className="mt-1 block italic text-neutral-500 dark:text-neutral-400">
                  Try: “{s.example}”
                </span>
              ) : null}
            </li>
          ))}
        </Panel>
      </div>

      {/* Highlights */}
      {analysis.highlights.length > 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Moments to review
          </h3>
          <div className="mt-4 space-y-4">
            {analysis.highlights.map((h, i) => (
              <div
                key={i}
                className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
              >
                <p className="text-sm italic text-neutral-600 dark:text-neutral-300">
                  “{h.quote}”
                </p>
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {h.issue}
                </p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                  ✓ {h.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Transcript */}
      <details className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <summary className="cursor-pointer font-semibold text-neutral-900 dark:text-white">
          Full transcript
        </summary>
        <div className="mt-4 space-y-2 text-sm">
          {turns.map((t, i) => (
            <p key={i} className="text-neutral-700 dark:text-neutral-300">
              <span className="font-medium">
                {t.role === "user" ? "You" : "AI"}:
              </span>{" "}
              {t.content}
            </p>
          ))}
        </div>
      </details>

      <div className="flex gap-3">
        <LinkButton href="/dashboard" variant="secondary">
          Back to dashboard
        </LinkButton>
      </div>
    </div>
  );
}

function Panel({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "good" | "warn";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <h3
        className={cn(
          "font-semibold",
          tone === "good"
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-amber-700 dark:text-amber-400",
        )}
      >
        {title}
      </h3>
      <ul className="mt-3 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
        {children}
      </ul>
    </div>
  );
}
