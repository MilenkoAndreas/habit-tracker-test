-- ============================================================
-- Antigravity Habit Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor (dashboard → SQL Editor)
-- ============================================================

-- ── Tables ────────────────────────────────────────────────────────────────

-- Profiles: one row per user, auto-created on sign-up via trigger below.
-- Stores settings and the active challenge as a JSONB blob.
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email            TEXT,
  onboarded        BOOLEAN     DEFAULT FALSE,
  dark_mode        BOOLEAN     DEFAULT FALSE,
  notification_prefs JSONB     DEFAULT '{"enabled":true,"morning":{"enabled":true,"hour":9,"minute":0},"evening":{"enabled":true,"hour":19,"minute":0}}'::jsonb,
  challenge        JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Habits: one row per habit, soft-deleted via deleted_at.
CREATE TABLE IF NOT EXISTS public.habits (
  id           TEXT        PRIMARY KEY,          -- Date.now().toString() from app
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name         TEXT        NOT NULL,
  emoji        TEXT        DEFAULT '⭐',
  type         TEXT        CHECK (type IN ('once', 'volume')) NOT NULL DEFAULT 'once',
  target_count INTEGER     DEFAULT 1,
  color        TEXT,
  reminder     JSONB       DEFAULT '{"enabled":false,"hour":9,"minute":0}'::jsonb,
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ                       -- NULL = active, non-NULL = deleted
);

-- Completions: each tap that marks a habit done.
CREATE TABLE IF NOT EXISTS public.completions (
  id           TEXT        PRIMARY KEY,          -- Date.now().toString() from app
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  habit_id     TEXT        REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  date         TEXT        NOT NULL,             -- YYYY-MM-DD (UTC)
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Habits
CREATE POLICY "Users can manage own habits"
  ON public.habits FOR ALL USING (auth.uid() = user_id);

-- Completions
CREATE POLICY "Users can manage own completions"
  ON public.completions FOR ALL USING (auth.uid() = user_id);

-- ── Auto-create profile on sign-up ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
