-- ─────────────────────────────────────────────────────────────────────────────
-- Storage · buckets y políticas
-- Todas las rutas de subida empiezan por <user_id>/..., así que cada usuario
-- gestiona su propia carpeta. pet-photos es público (foto de perfil).
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('paw-photos',    'paw-photos',    false, 10485760,  ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('pet-photos',    'pet-photos',    true,  10485760,  ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('clinical-docs', 'clinical-docs', false, 20971520,  ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('pet-videos',    'pet-videos',    false, 104857600, ARRAY['video/mp4'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
DECLARE b TEXT;
BEGIN
  FOREACH b IN ARRAY ARRAY['paw-photos','pet-photos','clinical-docs','pet-videos'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_select');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_insert');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_update');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_delete');
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)', b || '_own_select', b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)', b || '_own_insert', b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)', b || '_own_update', b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)', b || '_own_delete', b);
  END LOOP;
END $$;

-- Miembros de la mascota pueden ver sus fotos y documentos (ruta <owner>/<pet_id>/...)
DROP POLICY IF EXISTS "pet_member_read_photos" ON storage.objects;
CREATE POLICY "pet_member_read_photos" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('paw-photos','pet-videos','pet-photos')
    AND public.can_access_pet(NULLIF((storage.foldername(name))[2], '')::uuid, 'fotos', 'view')
  );

-- Foto de perfil pública
DROP POLICY IF EXISTS "pet_photos_public_read" ON storage.objects;
CREATE POLICY "pet_photos_public_read" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'pet-photos');
