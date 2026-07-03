"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button, LinkButton } from "@/components/ui/button";

/** Generates the review on demand when the review page has no analysis yet. */
export function AnalyzeTrigger({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function run() {
    setError(null);
    try {
      const res = await fetch("/api/speaking/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not generate your review.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while generating your review.");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
      {error ? (
        <>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <div className="mt-4 flex justify-center gap-3">
            <LinkButton href="/dashboard" variant="secondary">
              Back to dashboard
            </LinkButton>
            <Button onClick={run}>Try again</Button>
          </div>
        </>
      ) : (
        <>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-indigo-600" />
          <p className="mt-4 text-neutral-600 dark:text-neutral-300">
            Analyzing your session and preparing your review…
          </p>
        </>
      )}
    </div>
  );
}
