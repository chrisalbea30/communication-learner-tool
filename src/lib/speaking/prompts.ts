import type { SpeakingMode } from "@/lib/types/database";
import type { AnalysisResult } from "@/lib/speaking/modes";

/** Server-side prompt construction + analysis parsing for the speaking practices. */

const SHARED_RULES = `
Guidelines for how you speak:
- This is a live voice call. Your reply is read aloud by a text-to-speech voice, so write plain, natural spoken sentences. No markdown, bullet points, headings, emojis, or stage directions.
- Keep every reply short — 1 to 3 sentences — and ask only one question at a time.
- Stay fully in character and keep everything in English.
- Be warm and encouraging, but realistic.
- Do NOT correct the learner's grammar or vocabulary during the conversation; that feedback is saved for the end. If you can't understand them, gently ask them to rephrase.
- Always respond to what the learner actually just said before moving on.`;

function get(config: Record<string, string>, key: string): string {
  return (config[key] ?? "").trim();
}

export function buildSystemPrompt(
  mode: SpeakingMode,
  config: Record<string, string>,
  learnerName: string,
): string {
  const name = learnerName || "the learner";

  if (mode === "interview") {
    const position = get(config, "position") || "the role";
    const company = get(config, "company");
    const seniority = get(config, "seniority") || "Mid-level";
    const focus = get(config, "focus") || "General";
    return `You are Alex, a friendly and professional job interviewer. You are interviewing ${name} for a ${seniority} ${position} position${
      company ? ` at ${company}` : ""
    }. This is a ${focus.toLowerCase()} interview.
Begin by greeting ${name} warmly, briefly confirming the role, and asking your first question. Then continue the interview, asking natural follow-up questions based on their answers.${SHARED_RULES}`;
  }

  if (mode === "introduce") {
    const setting = get(config, "setting") || "a professional setting";
    const background = get(config, "background");
    return `You are a supportive English communication coach helping ${name} practice introducing themselves in this context: ${setting}.${
      background ? ` Context they shared about themselves: ${background}.` : ""
    }
Begin by warmly setting the scene for that context and inviting ${name} to introduce themselves. After they introduce themselves, respond the way a person in that setting naturally would (for example, a friendly follow-up question), and keep a short, natural back-and-forth going.${SHARED_RULES}`;
  }

  // presentation
  const topic = get(config, "topic") || "their work";
  const audience = get(config, "audience");
  const goal = get(config, "goal");
  return `You are a client${
    audience ? ` (${audience})` : ""
  } attending a meeting where ${name} presents their work. The presentation topic is: ${topic}.${
    goal ? ` The presenter's goal is: ${goal}.` : ""
  }
Begin by greeting ${name} and inviting them to walk you through their work. As they present, respond like an engaged, curious client: ask clarifying and mildly challenging questions one at a time, and show genuine interest.${SHARED_RULES}`;
}

const MODE_LABEL: Record<SpeakingMode, string> = {
  interview: "a mock job interview",
  introduce: "a self-introduction",
  presentation: "a client presentation",
};

export function analysisSystemPrompt(mode: SpeakingMode): string {
  return `You are an expert English communication coach. You will receive the transcript of a spoken practice session (${MODE_LABEL[mode]}). Analyze the LEARNER's spoken English and communication skills — ignore the AI's own lines except as context.

Return ONLY a JSON object with exactly these keys and shapes:
{
  "overall_score": <integer 0-100, overall communication effectiveness>,
  "summary": <2-3 sentence encouraging but honest summary>,
  "metrics": {
    "fluency": <0-100>, "grammar": <0-100>, "vocabulary": <0-100>,
    "clarity": <0-100>, "confidence": <0-100>
  },
  "strengths": [ { "title": <short>, "detail": <one sentence> } ],
  "improvements": [ { "title": <short>, "detail": <one sentence>, "example": <a better way to phrase something they said> } ],
  "highlights": [ { "quote": <the learner's actual words>, "issue": <what was off>, "suggestion": <a clearer/stronger rephrasing> } ]
}

Rules: base every observation on what the learner ACTUALLY said. Provide 2-4 strengths, 2-4 improvements, and 1-4 highlights. If the learner barely spoke, say so honestly and score low. Output nothing except the JSON object.`;
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Coerce arbitrary parsed JSON into a safe AnalysisResult. */
export function normalizeAnalysis(raw: unknown): AnalysisResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const m = (o.metrics ?? {}) as Record<string, unknown>;
  return {
    overall_score: clampScore(o.overall_score),
    summary: str(o.summary),
    metrics: {
      fluency: clampScore(m.fluency),
      grammar: clampScore(m.grammar),
      vocabulary: clampScore(m.vocabulary),
      clarity: clampScore(m.clarity),
      confidence: clampScore(m.confidence),
    },
    strengths: arr(o.strengths)
      .slice(0, 4)
      .map((s) => {
        const it = (s ?? {}) as Record<string, unknown>;
        return { title: str(it.title), detail: str(it.detail) };
      }),
    improvements: arr(o.improvements)
      .slice(0, 4)
      .map((s) => {
        const it = (s ?? {}) as Record<string, unknown>;
        return { title: str(it.title), detail: str(it.detail), example: str(it.example) };
      }),
    highlights: arr(o.highlights)
      .slice(0, 4)
      .map((s) => {
        const it = (s ?? {}) as Record<string, unknown>;
        return { quote: str(it.quote), issue: str(it.issue), suggestion: str(it.suggestion) };
      }),
  };
}
