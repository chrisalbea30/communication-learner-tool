export type VocabItem = {
  id: string;
  word: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  /** Three plausible-but-wrong meanings used as multiple-choice distractors. */
  distractors: [string, string, string];
  level: "beginner" | "intermediate" | "advanced";
};

/**
 * Starter vocabulary focused on professional communication. In a later
 * iteration this can be served from the database or generated per learner.
 */
export const VOCABULARY: VocabItem[] = [
  {
    id: "collaborate",
    word: "collaborate",
    partOfSpeech: "verb",
    meaning: "to work together with others on a task or project",
    example: "Our teams collaborate closely to ship features on time.",
    distractors: [
      "to finish a task completely alone",
      "to delay a decision on purpose",
      "to disagree strongly in a meeting",
    ],
    level: "beginner",
  },
  {
    id: "clarify",
    word: "clarify",
    partOfSpeech: "verb",
    meaning: "to make something clearer or easier to understand",
    example: "Could you clarify what you mean by 'soon'?",
    distractors: [
      "to make something more confusing",
      "to repeat a mistake",
      "to end a conversation abruptly",
    ],
    level: "beginner",
  },
  {
    id: "deadline",
    word: "deadline",
    partOfSpeech: "noun",
    meaning: "the latest time by which something must be finished",
    example: "The deadline for the proposal is Friday at noon.",
    distractors: [
      "the start date of a project",
      "a short daily meeting",
      "an unexpected day off",
    ],
    level: "beginner",
  },
  {
    id: "feedback",
    word: "feedback",
    partOfSpeech: "noun",
    meaning: "helpful information about how well you did something",
    example: "Thanks for the feedback — I'll revise the slides.",
    distractors: [
      "a formal complaint to management",
      "a technical error in software",
      "an unrelated side conversation",
    ],
    level: "beginner",
  },
  {
    id: "concise",
    word: "concise",
    partOfSpeech: "adjective",
    meaning: "giving a lot of information clearly in a few words",
    example: "Keep the summary concise — three sentences at most.",
    distractors: [
      "long and full of detail",
      "spoken very loudly",
      "written in a foreign language",
    ],
    level: "intermediate",
  },
  {
    id: "prioritize",
    word: "prioritize",
    partOfSpeech: "verb",
    meaning: "to decide which tasks are most important and do them first",
    example: "Let's prioritize the bug fixes before the new features.",
    distractors: [
      "to do every task at the same time",
      "to cancel all tasks",
      "to hand tasks to someone else",
    ],
    level: "intermediate",
  },
  {
    id: "stakeholder",
    word: "stakeholder",
    partOfSpeech: "noun",
    meaning: "a person with an interest or concern in a project",
    example: "We'll present the results to every stakeholder next week.",
    distractors: [
      "a tool used to hold documents",
      "someone who never uses the product",
      "a type of legal contract",
    ],
    level: "intermediate",
  },
  {
    id: "elaborate",
    word: "elaborate",
    partOfSpeech: "verb",
    meaning: "to add more detail or explain something further",
    example: "That's interesting — could you elaborate on the risks?",
    distractors: [
      "to summarize in one word",
      "to change the subject",
      "to agree without speaking",
    ],
    level: "intermediate",
  },
  {
    id: "leverage",
    word: "leverage",
    partOfSpeech: "verb",
    meaning: "to use something to maximum advantage",
    example: "We can leverage our existing data to improve the model.",
    distractors: [
      "to ignore a useful resource",
      "to break something on purpose",
      "to borrow money from a bank",
    ],
    level: "advanced",
  },
  {
    id: "align",
    word: "align",
    partOfSpeech: "verb",
    meaning: "to agree on a shared goal or approach",
    example: "Let's align on scope before we start building.",
    distractors: [
      "to arrange chairs in a room",
      "to end a partnership",
      "to postpone a launch",
    ],
    level: "advanced",
  },
  {
    id: "articulate",
    word: "articulate",
    partOfSpeech: "verb",
    meaning: "to express an idea clearly and effectively",
    example: "She articulated the strategy so everyone understood it.",
    distractors: [
      "to mumble under your breath",
      "to draw a diagram",
      "to memorize a list",
    ],
    level: "advanced",
  },
  {
    id: "mitigate",
    word: "mitigate",
    partOfSpeech: "verb",
    meaning: "to make a problem or risk less serious",
    example: "We added tests to mitigate the risk of regressions.",
    distractors: [
      "to make a problem worse",
      "to celebrate a success",
      "to assign blame to a teammate",
    ],
    level: "advanced",
  },
];
