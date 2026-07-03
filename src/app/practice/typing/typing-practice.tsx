"use client";

import { useMemo, useRef, useState } from "react";

import { Button, LinkButton } from "@/components/ui/button";
import { TYPING_SENTENCES } from "@/lib/content/sentences";
import {
  completeSession,
  createStudySession,
  logAttempt,
  updateSessionProgress,
} from "@/lib/practice/browser-log";

type Result = { accuracy: number; wpm: number };

function accuracyOf(target: string, typed: string): number {
  if (target.length === 0) return 100;
  let correct = 0;
  for (let i = 0; i < target.length; i++) {
    if (typed[i] === target[i]) correct++;
  }
  return Math.round((correct / target.length) * 100);
}

export function TypingPractice({
  userId,
  initialSessionId,
}: {
  userId: string;
  initialSessionId: string | null;
}) {
  const sentences = TYPING_SENTENCES;
  const total = sentences.length;

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [submittedResult, setSubmittedResult] = useState<Result | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [finished, setFinished] = useState(false);
  const startRef = useRef<number | null>(null);

  const target = sentences[index]?.text ?? "";
  const liveAccuracy = useMemo(() => accuracyOf(target, input), [target, input]);

  async function ensureSession(): Promise<string | null> {
    if (sessionId) return sessionId;
    const id = await createStudySession(userId, "typing", "Typing practice");
    setSessionId(id);
    return id;
  }

  function handleChange(value: string) {
    if (submittedResult) return;
    if (startRef.current === null && value.length > 0) {
      startRef.current = performance.now();
    }
    setInput(value);
  }

  async function handleSubmit() {
    if (submittedResult || input.length === 0) return;
    const elapsedMs =
      startRef.current === null ? 1 : performance.now() - startRef.current;
    const minutes = Math.max(elapsedMs / 60000, 1 / 60000);
    const words = target.length / 5;
    const wpm = Math.round(words / minutes);
    const accuracy = accuracyOf(target, input);
    const result: Result = { accuracy, wpm };

    setSubmittedResult(result);
    setResults((r) => [...r, result]);

    const id = await ensureSession();
    void logAttempt({
      userId,
      sessionId: id,
      kind: "typing",
      prompt: { sentenceId: sentences[index].id, target },
      response: { typed: input, wpm },
      isCorrect: accuracy === 100,
      score: accuracy,
    });
    if (id) void updateSessionProgress(id, { index });
  }

  function handleNext() {
    if (index + 1 >= total) {
      setFinished(true);
      if (sessionId) {
        void updateSessionProgress(sessionId, { index: total });
        void completeSession(sessionId);
      }
      return;
    }
    setIndex(index + 1);
    setInput("");
    setSubmittedResult(null);
    startRef.current = null;
  }

  if (finished) {
    const avgAcc = Math.round(
      results.reduce((s, r) => s + r.accuracy, 0) / (results.length || 1),
    );
    const avgWpm = Math.round(
      results.reduce((s, r) => s + r.wpm, 0) / (results.length || 1),
    );
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <div className="text-4xl">⌨️</div>
        <h2 className="mt-3 text-xl font-bold text-neutral-900 dark:text-white">
          Nice work!
        </h2>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Average accuracy {avgAcc}% · {avgWpm} WPM
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <LinkButton href="/dashboard" variant="secondary">
            Back to dashboard
          </LinkButton>
          <Button
            onClick={() => {
              setFinished(false);
              setIndex(0);
              setInput("");
              setSubmittedResult(null);
              setResults([]);
              setSessionId(null);
              startRef.current = null;
            }}
          >
            Practice again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
        <span>
          Sentence {index + 1} of {total}
        </span>
        {input.length > 0 ? <span>Accuracy: {liveAccuracy}%</span> : null}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="select-none text-lg leading-relaxed text-neutral-900 dark:text-white">
          {target}
        </p>

        <textarea
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (submittedResult) handleNext();
              else handleSubmit();
            }
          }}
          disabled={submittedResult !== null}
          autoFocus
          rows={3}
          placeholder="Type the sentence here…"
          className="mt-4 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-70 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />

        {submittedResult ? (
          <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm dark:bg-neutral-800/50">
            <p className="font-medium text-neutral-900 dark:text-white">
              {submittedResult.accuracy === 100
                ? "Perfect! 🎯"
                : `${submittedResult.accuracy}% accurate`}{" "}
              · {submittedResult.wpm} WPM
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex justify-end">
        {submittedResult ? (
          <Button onClick={handleNext} size="lg">
            {index + 1 >= total ? "Finish" : "Next sentence →"}
          </Button>
        ) : (
          <Button onClick={handleSubmit} size="lg" disabled={input.length === 0}>
            Check
          </Button>
        )}
      </div>
    </div>
  );
}
