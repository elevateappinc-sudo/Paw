-- Migration: Pet Videos in Gallery
-- Sprint paw-2026-W15

ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_storage_path TEXT;

CREATE TABLE IF NOT EXISTS public.pet_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT DEFAULT 'video/mp4' CHECK (mime_type = 'video/mp4'),
  file_size_bytes BIGINT NOT NULL,
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_storage_usage (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_video_bytes BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pet_videos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'pet_videos_own' AND tablename = 'pet_videos'
  ) THEN
    CREATE POLICY "pet_videos_own" ON public.pet_videos FOR ALL USING (user_id = auth.uid());
  END IF;
END$$;

ALTER TABLE public.user_storage_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'storage_usage_own' AND tablename = 'user_storage_usage'
  ) THEN
    CREATE POLICY "storage_usage_own" ON public.user_storage_usage FOR ALL USING (user_id = auth.uid());
  END IF;
END$$;
