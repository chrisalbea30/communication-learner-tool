"use client";

import { useMemo, useState } from "react";

import { Button, LinkButton } from "@/components/ui/button";
import { VOCABULARY, type VocabItem } from "@/lib/content/vocabulary";
import { cn } from "@/lib/utils";
import {
  completeSession,
  createStudySession,
  logAttempt,
  updateSessionProgress,
} from "@/lib/practice/browser-log";

type Question = {
  item: VocabItem;
  options: string[];
  correctIndex: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(item: VocabItem): Question {
  const options = shuffle([item.meaning, ...item.distractors]);
  return { item, options, correctIndex: options.indexOf(item.meaning) };
}

export function VocabPractice({
  userId,
  initialSession,
}: {
  userId: string;
  initialSession: { id: string; progress: { index?: number; score?: number } } | null;
}) {
  const questions = useMemo(() => VOCABULARY.map(buildQuestion), []);
  const total = questions.length;

  const [sessionId, setSessionId] = useState<string | null>(
    initialSession?.id ?? null,
  );
  const [index, setIndex] = useState(
    Math.min(initialSession?.progress?.index ?? 0, total - 1),
  );
  const [score, setScore] = useState(initialSession?.progress?.score ?? 0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const q = questions[index];
  const answered = selected !== null;

  async function ensureSession(): Promise<string | null> {
    if (sessionId) return sessionId;
    const id = await createStudySession(userId, "vocab", "Vocabulary practice");
    setSessionId(id);
    return id;
  }

  async function handleSelect(i: number) {
    if (answered) return;
    setSelected(i);
    const correct = i === q.correctIndex;
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);

    const id = await ensureSession();
    void logAttempt({
      userId,
      sessionId: id,
      kind: "vocab",
      prompt: { word: q.item.word, id: q.item.id },
      response: { chosen: q.options[i], correct },
      isCorrect: correct,
    });
    if (id) void updateSessionProgress(id, { index, score: newScore });
  }

  function handleNext() {
    if (index + 1 >= total) {
      setFinished(true);
      if (sessionId) {
        void updateSessionProgress(sessionId, { index: total, score });
        void completeSession(sessionId);
      }
      return;
    }
    setIndex(index + 1);
    setSelected(null);
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <div className="text-4xl">🎉</div>
        <h2 className="mt-3 text-xl font-bold text-neutral-900 dark:text-white">
          Practice complete
        </h2>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          You scored {score} / {total} ({pct}%).
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <LinkButton href="/dashboard" variant="secondary">
            Back to dashboard
          </LinkButton>
          <Button
            onClick={() => {
              setFinished(false);
              setIndex(0);
              setScore(0);
              setSelected(null);
              setSessionId(null);
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
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
        <span>
          Word {index + 1} of {total}
        </span>
        <span>Score: {score}</span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          {q.item.partOfSpeech}
        </span>
        <h2 className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
          {q.item.word}
        </h2>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          What does it mean?
        </p>

        <div className="mt-3 grid gap-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctIndex;
            const isChosen = i === selected;
            return (
              <button
                key={opt}
                onClick={() => handleSelect(i)}
                disabled={answered}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-sm transition",
                  !answered &&
                    "border-neutral-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800",
                  answered && isCorrect &&
                    "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
                  answered && isChosen && !isCorrect &&
                    "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300",
                  answered && !isChosen && !isCorrect && "opacity-60",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm dark:bg-neutral-800/50">
            <p className="font-medium text-neutral-900 dark:text-white">
              {selected === q.correctIndex ? "Correct! ✅" : "Not quite."}
            </p>
            <p className="mt-1 italic text-neutral-600 dark:text-neutral-300">
              “{q.item.example}”
            </p>
          </div>
        ) : null}
      </div>

      {answered ? (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleNext} size="lg">
            {index + 1 >= total ? "Finish" : "Next word →"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
