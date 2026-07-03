export type TypingSentence = {
  id: string;
  text: string;
  level: "beginner" | "intermediate" | "advanced";
};

/** Professional-communication sentences for typing / writing practice. */
export const TYPING_SENTENCES: TypingSentence[] = [
  { id: "s1", text: "Thanks for joining the call today.", level: "beginner" },
  { id: "s2", text: "Could you please share your screen?", level: "beginner" },
  { id: "s3", text: "I will send you the notes after the meeting.", level: "beginner" },
  {
    id: "s4",
    text: "Let me make sure I understand your requirements correctly.",
    level: "intermediate",
  },
  {
    id: "s5",
    text: "We are on track to deliver the first version next week.",
    level: "intermediate",
  },
  {
    id: "s6",
    text: "Please let me know if you have any questions or concerns.",
    level: "intermediate",
  },
  {
    id: "s7",
    text: "To summarize, we agreed on the scope, timeline, and budget.",
    level: "advanced",
  },
  {
    id: "s8",
    text: "I would appreciate your feedback before we move forward with the plan.",
    level: "advanced",
  },
  {
    id: "s9",
    text: "Our goal is to improve communication and collaboration across the team.",
    level: "advanced",
  },
  {
    id: "s10",
    text: "Thank you for your time; I look forward to working together on this project.",
    level: "advanced",
  },
];
