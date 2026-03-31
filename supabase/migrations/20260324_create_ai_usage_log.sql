-- Migration: sprint6 - ai_usage_log for vet-chat and content-hub
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id        UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  session_id    TEXT NOT NULL,
  model_used    TEXT NOT NULL,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd      NUMERIC(10, 6) NOT NULL DEFAULT 0,
  feature       TEXT NOT NULL DEFAULT 'vet-chat',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_date ON public.ai_usage_log (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_cost_date ON public.ai_usage_log (created_at, cost_usd);
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.ai_usage_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert" ON public.ai_usage_log FOR INSERT WITH CHECK (true);
