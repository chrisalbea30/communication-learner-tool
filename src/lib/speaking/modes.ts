import type { SpeakingMode } from "@/lib/types/database";

/** Isomorphic (client + server safe) metadata for the live speaking practices. */

export type SetupFieldType = "text" | "textarea" | "select";

export type SetupField = {
  name: string;
  label: string;
  type: SetupFieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  help?: string;
};

export type SpeakingModeMeta = {
  id: SpeakingMode;
  title: string;
  emoji: string;
  tagline: string;
  accent: string;
  startLabel: string;
  setupFields: SetupField[];
};

export const SPEAKING_MODES: Record<SpeakingMode, SpeakingModeMeta> = {
  interview: {
    id: "interview",
    title: "Mock Interview",
    emoji: "💼",
    tagline: "Tell us the role, then talk through a real interview with an AI interviewer.",
    accent: "from-indigo-500 to-violet-500",
    startLabel: "Start interview",
    setupFields: [
      {
        name: "position",
        label: "Position you're applying for",
        type: "text",
        placeholder: "e.g. Frontend Developer",
        required: true,
      },
      {
        name: "company",
        label: "Company (optional)",
        type: "text",
        placeholder: "e.g. Acme Inc.",
      },
      {
        name: "seniority",
        label: "Level",
        type: "select",
        options: ["Internship", "Junior", "Mid-level", "Senior", "Lead / Manager"],
      },
      {
        name: "focus",
        label: "Interview focus",
        type: "select",
        options: ["General", "Behavioral", "Technical", "Culture fit"],
      },
    ],
  },
  introduce: {
    id: "introduce",
    title: "Introduce Yourself",
    emoji: "👋",
    tagline: "Practice a confident, natural self-introduction.",
    accent: "from-sky-500 to-cyan-500",
    startLabel: "Start practice",
    setupFields: [
      {
        name: "setting",
        label: "Where are you introducing yourself?",
        type: "select",
        options: [
          "Job interview",
          "Networking event",
          "First day on a new team",
          "Client kickoff meeting",
        ],
      },
      {
        name: "background",
        label: "A little about you (optional)",
        type: "textarea",
        placeholder: "e.g. I'm a designer with 3 years of experience, switching into product.",
        help: "This helps the coach set the scene — one or two sentences is plenty.",
      },
    ],
  },
  presentation: {
    id: "presentation",
    title: "Present to a Client",
    emoji: "📊",
    tagline: "Present your work and field questions from a virtual client.",
    accent: "from-amber-500 to-orange-500",
    startLabel: "Start presentation",
    setupFields: [
      {
        name: "topic",
        label: "What are you presenting?",
        type: "text",
        placeholder: "e.g. Q3 marketing results and next quarter's plan",
        required: true,
      },
      {
        name: "audience",
        label: "Who is the client? (optional)",
        type: "text",
        placeholder: "e.g. Head of Marketing at a retail brand",
      },
      {
        name: "goal",
        label: "What outcome do you want? (optional)",
        type: "textarea",
        placeholder: "e.g. Get sign-off on the proposed budget.",
      },
    ],
  },
};

export function isSpeakingMode(value: string): value is SpeakingMode {
  return value === "interview" || value === "introduce" || value === "presentation";
}

/** Structured result of a post-session analysis (shared by API + review UI). */
export type AnalysisMetrics = {
  fluency: number;
  grammar: number;
  vocabulary: number;
  clarity: number;
  confidence: number;
};

export type AnalysisResult = {
  overall_score: number;
  summary: string;
  metrics: AnalysisMetrics;
  strengths: { title: string; detail: string }[];
  improvements: { title: string; detail: string; example: string }[];
  highlights: { quote: string; issue: string; suggestion: string }[];
};

export const METRIC_LABELS: Record<keyof AnalysisMetrics, string> = {
  fluency: "Fluency",
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  clarity: "Clarity",
  confidence: "Confidence",
};
