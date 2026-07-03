/**
 * Hand-written types mirroring `supabase/migrations/0001_init.sql`.
 * Keep in sync with the schema (or later replace with `supabase gen types`).
 *
 * NOTE: these are `type` aliases, not `interface`s — interfaces lack an
 * implicit string index signature and so don't satisfy Supabase's
 * `Record<string, unknown>` table constraint, which silently degrades query
 * result types to `never`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SessionStatus = "active" | "completed" | "abandoned";
export type StudyKind =
  | "vocab"
  | "typing"
  | "interview"
  | "introduce"
  | "presentation";
export type SpeakingMode = "interview" | "introduce" | "presentation";
export type TurnRole = "user" | "assistant";

export type Profile = {
  id: string;
  username: string;
  display_username: string;
  native_language: string | null;
  english_level: string | null;
  goal: string | null;
  created_at: string;
  updated_at: string;
};

export type StudySession = {
  id: string;
  user_id: string;
  kind: StudyKind;
  status: SessionStatus;
  title: string | null;
  progress: Json;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type PracticeAttempt = {
  id: string;
  user_id: string;
  session_id: string | null;
  kind: "vocab" | "typing";
  prompt: Json;
  response: Json;
  is_correct: boolean | null;
  score: number | null;
  created_at: string;
};

export type SpeakingSession = {
  id: string;
  user_id: string;
  mode: SpeakingMode;
  config: Json;
  status: "active" | "completed";
  started_at: string;
  completed_at: string | null;
};

export type SpeakingTurn = {
  id: string;
  session_id: string;
  user_id: string;
  role: TurnRole;
  content: string;
  seq: number;
  created_at: string;
};

export type SessionAnalysis = {
  id: string;
  session_id: string;
  user_id: string;
  overall_score: number | null;
  summary: string | null;
  metrics: Json;
  strengths: Json;
  improvements: Json;
  highlights: Json;
  created_at: string;
};

type Insert<T, Optional extends keyof T> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;

type Table<R, I> = {
  Row: R;
  Insert: I;
  Update: Partial<R>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        Profile,
        Insert<
          Profile,
          "native_language" | "english_level" | "goal" | "created_at" | "updated_at"
        >
      >;
      study_sessions: Table<
        StudySession,
        Insert<
          StudySession,
          | "id"
          | "status"
          | "title"
          | "progress"
          | "started_at"
          | "updated_at"
          | "completed_at"
        >
      >;
      practice_attempts: Table<
        PracticeAttempt,
        Insert<
          PracticeAttempt,
          "id" | "session_id" | "prompt" | "response" | "is_correct" | "score" | "created_at"
        >
      >;
      speaking_sessions: Table<
        SpeakingSession,
        Insert<SpeakingSession, "id" | "config" | "status" | "started_at" | "completed_at">
      >;
      speaking_turns: Table<SpeakingTurn, Insert<SpeakingTurn, "id" | "created_at">>;
      session_analyses: Table<
        SessionAnalysis,
        Insert<
          SessionAnalysis,
          | "id"
          | "overall_score"
          | "summary"
          | "metrics"
          | "strengths"
          | "improvements"
          | "highlights"
          | "created_at"
        >
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
