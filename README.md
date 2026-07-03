# 🗣️ Fluent — English Communication Learner

An AI-powered English fluency coach. Learners sign in, practice vocabulary and
typing, and (soon) run live speaking practices — mock interviews, self-
introductions, and client presentations — with an AI review afterward.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Supabase (Auth + Postgres + RLS) · OpenAI (conversation + analysis) ·
ElevenLabs (AI voice) · browser Web Speech API (speech-to-text).

---

## Setup

You need a Supabase project and an OpenAI API key (you said you have both).

### 1. Fill in `.env.local`

Open `.env.local` and replace the placeholders:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → **Project Settings → API** → *Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page → *Project API keys* → **anon / public** |
| `SUPABASE_SERVICE_ROLE_KEY` | same page → *Project API keys* → **service_role** (keep secret!) |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `OPENAI_MODEL` | leave as `gpt-4o-mini`, or any chat model your key can access |
| `ELEVENLABS_API_KEY` | elevenlabs.io → Profile → API key (used for the AI voice) |
| `ELEVENLABS_VOICE_ID` | a voice id from your ElevenLabs Voice Library (default = "Rachel") |
| `ELEVENLABS_MODEL_ID` | leave as `eleven_turbo_v2_5` (low-latency, good for conversation) |
| `AUTH_EMAIL_DOMAIN` | leave as-is (internal only, never emailed) |

### 2. Create the database schema

In the Supabase Dashboard → **SQL Editor → New query**, paste the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and run
it. This creates all tables, the auto-profile trigger, and row-level security.

### 3. Auth provider

The **Email** provider must be enabled (it is by default:
Dashboard → **Authentication → Providers → Email**). You do **not** need to
enable email confirmations — accounts are created pre-confirmed on the server,
and no email is ever sent.

### 4. Run it

```bash
npm run dev
```

Open http://localhost:3000, create an account with a username + password, and
you'll land on the dashboard.

---

## How auth works

You asked for **username + password only** (no email, no OAuth). Supabase Auth
is email-based, so each username is mapped deterministically to an internal
address (`<username>@<AUTH_EMAIL_DOMAIN>`) that is never used to send mail. This
keeps `auth.uid()` and row-level security working exactly as normal while the
user only ever sees a username field. See `src/lib/auth/username.ts`.

## Project structure

```
src/
  proxy.ts                     # Next 16 "proxy" (renamed middleware): session refresh + route guard
  app/
    page.tsx                   # landing (redirects to /dashboard if signed in)
    login/  signup/            # username+password auth pages
    dashboard/                 # authed home: continue session / start learning
    practice/vocab/            # ✅ vocabulary multiple-choice drill
    practice/typing/           # ✅ typing accuracy + WPM drill
    speaking/[mode]/           # ✅ setup form for interview | introduce | presentation
    speaking/[mode]/[sessionId]/         # ✅ live voice conversation room
    speaking/[mode]/[sessionId]/review/  # ✅ AI post-session analysis
    api/auth/                  # signup / login / logout route handlers
    api/tts/                   # ElevenLabs text-to-speech proxy (key stays server-side)
    api/speaking/              # create session, /turn (OpenAI reply), /analyze (review)
  lib/
    supabase/                  # browser, server, admin clients + proxy session helper
    auth/                      # username validation + current-user guard
    content/                   # vocabulary + typing seed content
    practice/                  # browser-side progress logging
    speaking/                  # mode registry, prompts, STT + TTS hooks
    openai.ts                  # OpenAI client
    types/database.ts          # typed schema (mirrors the SQL migration)
supabase/migrations/0001_init.sql
```

## The speaking flow

1. Pick a mode on the dashboard → fill the short setup form (e.g. the role you're
   applying for) → a `speaking_session` is created.
2. In the room you press the mic, speak your answer (browser transcribes it),
   and the AI replies **in an ElevenLabs voice**. Repeat as a back-and-forth.
3. Press **End & get review** → OpenAI analyzes your transcript and produces a
   scored review (fluency, grammar, vocabulary, clarity, confidence), strengths,
   improvements, and specific moments to fix.

> **Browser note:** speech-to-text uses the Web Speech API, best supported in
> **Chrome and Edge**. In other browsers the mic is hidden and you can type
> answers instead (the AI voice still works everywhere).

## Roadmap

- **Phase 0–1 ✅** — auth, dashboard, DB schema + RLS
- **Phase 2 ✅** — vocabulary + typing drills (work offline, no API keys needed)
- **Phase 3 ✅** — voice layer: Web Speech API STT + ElevenLabs TTS
- **Phase 4 ✅** — live AI speaking practices (interview / introduce / present) + post-session analysis
- **Next ideas** — progress history & streaks, saved reviews list, per-learner adaptive vocabulary, more languages
