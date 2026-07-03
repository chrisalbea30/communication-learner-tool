"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { SpeakingModeMeta } from "@/lib/speaking/modes";

export function SetupForm({ mode }: { mode: SpeakingModeMeta }) {
  const router = useRouter();
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of mode.setupFields) {
      if (f.type === "select" && f.options?.length) init[f.name] = f.options[0];
    }
    return init;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(name: string, value: string) {
    setConfig((c) => ({ ...c, [name]: value }));
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    for (const f of mode.setupFields) {
      if (f.required && !(config[f.name] ?? "").trim()) {
        setError(`Please fill in "${f.label}".`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: mode.id, config }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Could not start. Please try again.");
        return;
      }
      router.push(`/speaking/${mode.id}/${data.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleStart} className="space-y-5">
      {mode.setupFields.map((f) => (
        <div key={f.name}>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {f.label}
          </label>
          {f.type === "select" ? (
            <select
              value={config[f.name] ?? ""}
              onChange={(e) => update(f.name, e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-neutral-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              value={config[f.name] ?? ""}
              onChange={(e) => update(f.name, e.target.value)}
              placeholder={f.placeholder}
              rows={3}
              className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          ) : (
            <input
              type="text"
              value={config[f.name] ?? ""}
              onChange={(e) => update(f.name, e.target.value)}
              placeholder={f.placeholder}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          )}
          {f.help ? (
            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              {f.help}
            </p>
          ) : null}
        </div>
      ))}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Starting…" : mode.startLabel}
      </Button>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        You'll speak using your microphone. The AI replies out loud, then reviews
        your English at the end.
      </p>
    </form>
  );
}
