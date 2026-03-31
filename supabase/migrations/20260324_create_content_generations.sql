CREATE TABLE IF NOT EXISTS public.content_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('instagram_post', 'instagram_story', 'tiktok_caption')),
  tone TEXT NOT NULL CHECK (tone IN ('divertido', 'emotivo', 'informativo', 'cumpleanos')),
  social_network TEXT NOT NULL CHECK (social_network IN ('instagram', 'tiktok')),
  caption TEXT NOT NULL,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_content_gen_user ON public.content_generations (user_id, created_at DESC);
ALTER TABLE public.content_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_gen_own" ON public.content_generations FOR ALL USING (auth.uid() = user_id);
