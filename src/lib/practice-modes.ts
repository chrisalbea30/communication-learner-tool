import type { StudyKind } from "@/lib/types/database";

export type ModeCategory = "speaking" | "drill";

export interface PracticeMode {
  slug: StudyKind;
  title: string;
  blurb: string;
  emoji: string;
  href: string;
  category: ModeCategory;
  /** Tailwind gradient classes for the card accent. */
  accent: string;
}

export const PRACTICE_MODES: PracticeMode[] = [
  {
    slug: "interview",
    title: "Mock Interview",
    blurb: "Define the role you're applying for and talk through a real interview with an AI interviewer.",
    emoji: "💼",
    href: "/speaking/interview",
    category: "speaking",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    slug: "introduce",
    title: "Introduce Yourself",
    blurb: "Practice a confident, natural self-introduction for any professional setting.",
    emoji: "👋",
    href: "/speaking/introduce",
    category: "speaking",
    accent: "from-sky-500 to-cyan-500",
  },
  {
    slug: "presentation",
    title: "Present to a Client",
    blurb: "Rehearse presenting your work and fielding questions from a virtual client.",
    emoji: "📊",
    href: "/speaking/presentation",
    category: "speaking",
    accent: "from-amber-500 to-orange-500",
  },
  {
    slug: "vocab",
    title: "Vocabulary",
    blurb: "Build the words you need with quick, spaced practice.",
    emoji: "📚",
    href: "/practice/vocab",
    category: "drill",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    slug: "typing",
    title: "Typing & Writing",
    blurb: "Sharpen spelling and sentence construction through typing drills.",
    emoji: "⌨️",
    href: "/practice/typing",
    category: "drill",
    accent: "from-rose-500 to-pink-500",
  },
];

export const MODE_BY_SLUG: Record<StudyKind, PracticeMode> =
  Object.fromEntries(PRACTICE_MODES.map((m) => [m.slug, m])) as Record<
    StudyKind,
    PracticeMode
  >;
