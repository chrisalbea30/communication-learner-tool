-- ============================================================================
-- English Communication Learner — initial schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

-- ── Helper: keep updated_at fresh ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per auth user. `username` is the normalized (lower-cased) handle used
-- for the username+password login; `display_username` keeps the original case.
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  username          text not null unique,
  display_username  text not null,
  native_language   text,
  english_level     text,               -- self-assessed: beginner | intermediate | advanced
  goal              text,               -- free text: why they're learning
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Auto-create a profile when an auth user is created ──────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_username)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data ->> 'display_username',
             new.raw_user_meta_data ->> 'username',
             split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any auth users created before this trigger existed
-- (e.g. accounts made while testing before the schema was applied).
insert into public.profiles (id, username, display_username)
select
  u.id,
  lower(coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1))),
  coalesce(
    u.raw_user_meta_data ->> 'display_username',
    u.raw_user_meta_data ->> 'username',
    split_part(u.email, '@', 1)
  )
from auth.users u
on conflict (id) do nothing;

-- ── study_sessions ──────────────────────────────────────────────────────────
-- A resumable study session. The dashboard "Continue" reads the most recent
-- session whose status = 'active'. `progress` holds module-specific resume data.
create table if not exists public.study_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  kind         text not null,          -- vocab | typing | interview | introduce | presentation
  status       text not null default 'active',  -- active | completed | abandoned
  title        text,
  progress     jsonb not null default '{}'::jsonb,
  started_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists study_sessions_user_active_idx
  on public.study_sessions (user_id, status, updated_at desc);

drop trigger if exists study_sessions_set_updated_at on public.study_sessions;
create trigger study_sessions_set_updated_at
  before update on public.study_sessions
  for each row execute function public.set_updated_at();

-- ── practice_attempts ───────────────────────────────────────────────────────
-- Individual drill results (vocabulary, typing, etc).
create table if not exists public.practice_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  session_id  uuid references public.study_sessions (id) on delete set null,
  kind        text not null,           -- vocab | typing
  prompt      jsonb not null default '{}'::jsonb,
  response    jsonb not null default '{}'::jsonb,
  is_correct  boolean,
  score       numeric,
  created_at  timestamptz not null default now()
);

create index if not exists practice_attempts_user_idx
  on public.practice_attempts (user_id, created_at desc);

-- ── speaking_sessions ───────────────────────────────────────────────────────
-- The core live AI practices: mock interview, introduce-yourself, client
-- presentation. `config` carries the scenario (e.g. { position, company }).
create table if not exists public.speaking_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  mode         text not null,          -- interview | introduce | presentation
  config       jsonb not null default '{}'::jsonb,
  status       text not null default 'active',  -- active | completed
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists speaking_sessions_user_idx
  on public.speaking_sessions (user_id, started_at desc);

-- ── speaking_turns ──────────────────────────────────────────────────────────
-- Each utterance in a speaking session. role = 'user' (transcribed speech) or
-- 'assistant' (the AI interviewer/coach). No audio is stored — the browser
-- Web Speech API produces text transcripts.
create table if not exists public.speaking_turns (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.speaking_sessions (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null,           -- user | assistant
  content     text not null,
  seq         integer not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists speaking_turns_session_seq_idx
  on public.speaking_turns (session_id, seq);

-- ── session_analyses ────────────────────────────────────────────────────────
-- Post-session AI analysis of a speaking session: what went well, what went
-- wrong, and where to improve.
create table if not exists public.session_analyses (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null unique references public.speaking_sessions (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  overall_score numeric,               -- 0-100
  summary       text,
  metrics       jsonb not null default '{}'::jsonb,  -- fluency, grammar, vocabulary, pace, fillers
  strengths     jsonb not null default '[]'::jsonb,  -- [{ title, detail }]
  improvements  jsonb not null default '[]'::jsonb,  -- [{ title, detail, example }]
  highlights    jsonb not null default '[]'::jsonb,  -- [{ quote, issue, suggestion, turn_seq }]
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- Row-Level Security — every table is owner-scoped to the authenticated user.
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.study_sessions    enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.speaking_sessions enable row level security;
alter table public.speaking_turns    enable row level security;
alter table public.session_analyses  enable row level security;

-- profiles: read/update own row (insert handled by the trigger).
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Generic owner policy pattern for the rest (select/insert/update/delete own).
drop policy if exists "study_sessions owner" on public.study_sessions;
create policy "study_sessions owner" on public.study_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "practice_attempts owner" on public.practice_attempts;
create policy "practice_attempts owner" on public.practice_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "speaking_sessions owner" on public.speaking_sessions;
create policy "speaking_sessions owner" on public.speaking_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "speaking_turns owner" on public.speaking_turns;
create policy "speaking_turns owner" on public.speaking_turns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "session_analyses owner" on public.session_analyses;
create policy "session_analyses owner" on public.session_analyses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
