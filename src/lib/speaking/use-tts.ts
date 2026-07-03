"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Plays the AI's spoken replies via the server ElevenLabs proxy (`/api/tts`).
 * If ElevenLabs fails for any reason (free-plan limits, quota exhausted, network),
 * it falls back to the browser's built-in speech synthesis so the AI is never
 * silent. Only one clip plays at a time — calling `speak` again interrupts it.
 */
export function useTts() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setSpeaking(false);
  }, [cleanup]);

  const browserFallback = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      cleanup();
      setError(null);
      setSpeaking(true);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) {
          // ElevenLabs unavailable (plan/quota/etc.) — use the browser voice.
          browserFallback(text);
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setSpeaking(false);
          if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
          }
        };
        await audio.play();
      } catch {
        browserFallback(text);
      }
    },
    [cleanup, browserFallback],
  );

  useEffect(() => () => cleanup(), [cleanup]);

  return { speak, stop, speaking, error };
}
