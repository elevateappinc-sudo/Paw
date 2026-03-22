-- F1c: Supabase Storage + Migración base64
-- Añadir campo de tracking de migración en users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS migration_completed BOOLEAN DEFAULT false;

-- Tabla para fotos de mascotas (Storage)
CREATE TABLE IF NOT EXISTS public.pet_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_migration_failed BOOLEAN DEFAULT false,
  original_filename TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pet_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_photos_own" ON public.pet_photos
  FOR ALL
  USING (user_id = auth.uid());
