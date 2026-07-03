"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { SpeakingModeMeta } from "@/lib/speaking/modes";
import { useSpeechRecognition } from "@/lib/speaking/use-speech-recognition";
import { useTts } from "@/lib/speaking/use-tts";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; content: string };

export function SpeakingRoom({
  sessionId,
  mode,
  initialTurns,
}: {
  sessionId: string;
  mode: SpeakingModeMeta;
  initialTurns: Turn[];
}) {
  const router = useRouter();
  const stt = useSpeechRecognition();
  const tts = useTts();

  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [started, setStarted] = useState(initialTurns.length > 0);
  const [thinking, setThinking] = useState(false);
  const [ending, setEnding] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, thinking, stt.interim]);

  const hasUserSpoken = turns.some((t) => t.role === "user");
  const busy = thinking || ending;

  async function sendTurn(userText: string | null) {
    if (busy) return;
    setError(null);
    if (userText) setTurns((t) => [...t, { role: "user", content: userText }]);
    setThinking(true);
    try {
      const res = await fetch("/api/speaking/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userText: userText ?? "" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      if (!res.ok || !data.reply) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setTurns((t) => [...t, { role: "assistant", content: data.reply as string }]);
      void tts.speak(data.reply);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setThinking(false);
    }
  }

  function handleStart() {
    setStarted(true);
    void sendTurn(null);
  }

  function toggleMic() {
    if (busy) return;
    if (stt.listening) {
      const text = stt.stop();
      if (text) void sendTurn(text);
    } else {
      tts.stop();
      stt.start();
    }
  }

  function handleTypedSend() {
    const text = typed.trim();
    if (!text || busy) return;
    setTyped("");
    void sendTurn(text);
  }

  async function handleEnd() {
    if (ending) return;
    setEnding(true);
    setError(null);
    tts.stop();
    if (stt.listening) stt.stop();
    try {
      const res = await fetch("/api/speaking/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not generate your review.");
        setEnding(false);
        return;
      }
      router.push(`/speaking/${mode.id}/${sessionId}/review`);
    } catch {
      setError("Network error while generating your review.");
      setEnding(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Transcript */}
      <div className="min-h-[320px] rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        {turns.length === 0 && !thinking ? (
          <div className="flex h-72 flex-col items-center justify-center text-center">
            <div className="text-4xl">{mode.emoji}</div>
            <p className="mt-3 max-w-sm text-neutral-500 dark:text-neutral-400">
              {mode.tagline}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {turns.map((t, i) => (
              <Bubble key={i} role={t.role} emoji={mode.emoji}>
                {t.content}
              </Bubble>
            ))}
            {thinking ? (
              <Bubble role="assistant" emoji={mode.emoji}>
                <span className="inline-flex gap-1">
                  <Dot /> <Dot /> <Dot />
                </span>
              </Bubble>
            ) : null}
            {stt.listening && stt.interim ? (
              <Bubble role="user" emoji={mode.emoji} muted>
                {stt.interim}…
              </Bubble>
            ) : null}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Status line */}
      <div className="mt-3 h-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {ending
          ? "Analyzing your session…"
          : tts.speaking
            ? "🔊 Speaking…"
            : stt.listening
              ? "🎙️ Listening… tap Stop when you're done"
              : thinking
                ? "Thinking…"
                : ""}
      </div>

      {error ? (
        <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {/* Controls */}
      {!started ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <Button size="lg" onClick={handleStart}>
            {mode.startLabel} →
          </Button>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Your browser will ask for microphone access.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {stt.supported ? (
            <div className="flex justify-center">
              <button
                onClick={toggleMic}
                disabled={busy}
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white shadow-lg transition disabled:opacity-50",
                  stt.listening
                    ? "animate-pulse bg-red-500 hover:bg-red-600"
                    : "bg-indigo-600 hover:bg-indigo-500",
                )}
                aria-label={stt.listening ? "Stop and send" : "Start speaking"}
              >
                {stt.listening ? "⏹" : "🎙️"}
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-amber-600 dark:text-amber-400">
              Speech recognition isn't supported in this browser (try Chrome or
              Edge). You can type your answers below instead.
            </p>
          )}

          <div className="flex items-end gap-2">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTypedSend();
                }
              }}
              disabled={busy}
              placeholder="…or type your answer"
              className="h-11 flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-neutral-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <Button variant="secondary" onClick={handleTypedSend} disabled={busy || !typed.trim()}>
              Send
            </Button>
          </div>

          <div className="flex justify-center pt-1">
            <Button
              variant="danger"
              onClick={handleEnd}
              disabled={ending || !hasUserSpoken}
            >
              {ending ? "Generating review…" : "End & get review"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({
  role,
  emoji,
  muted,
  children,
}: {
  role: "user" | "assistant";
  emoji: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm dark:bg-neutral-800">
          {emoji}
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
          muted && "opacity-60",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Dot() {
  return (
    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-neutral-400" />
  );
}
