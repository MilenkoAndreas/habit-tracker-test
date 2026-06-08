-- ============================================================
-- AI Insights migration — run AFTER supabase-schema.sql
-- Adds the ai_insights table for caching Claude-generated coaching
-- and reflection summaries.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type         TEXT        CHECK (type IN ('coaching', 'weekly', 'monthly')) NOT NULL,
  content      TEXT        NOT NULL,
  period_start DATE,       -- NULL for coaching; YYYY-MM-DD for weekly/monthly
  period_end   DATE,       -- NULL for coaching; YYYY-MM-DD for weekly/monthly
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS ai_insights_user_type_idx
  ON public.ai_insights (user_id, type, generated_at DESC);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own insights"
  ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Edge functions run as the authenticated user via the passed JWT,
-- so standard RLS covers all access — no service-role bypass needed.
