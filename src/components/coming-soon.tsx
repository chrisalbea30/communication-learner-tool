import { LinkButton } from "@/components/ui/button";

export function ComingSoon({
  emoji,
  what,
  points,
}: {
  emoji: string;
  what: string;
  points: string[];
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-4xl">{emoji}</div>
      <span className="mt-4 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
        Coming next
      </span>
      <p className="mt-3 text-neutral-700 dark:text-neutral-200">{what}</p>
      <ul className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <span className="mt-0.5 text-indigo-500">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <LinkButton href="/dashboard" variant="secondary">
          Back to dashboard
        </LinkButton>
      </div>
    </div>
  );
}
