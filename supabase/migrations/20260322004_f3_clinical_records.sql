-- F3: Historial Clínico de mascotas
-- Tablas: clinical_records, clinical_documents, storage_cleanup_queue, share_tokens
-- Bucket: clinical-docs (privado)

-- =============================================
-- clinical_records
-- =============================================
CREATE TABLE IF NOT EXISTS public.clinical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_by_role TEXT DEFAULT 'owner',
  visit_date DATE NOT NULL,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('consulta_general','emergencia','cirugia','control_rutina','peluqueria','otro')),
  vet_name TEXT,
  clinic_name TEXT,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  vaccine_id UUID REFERENCES public.vaccines(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinical_records_own" ON public.clinical_records
  FOR ALL USING (user_id = auth.uid());

-- =============================================
-- clinical_documents
-- =============================================
CREATE TABLE IF NOT EXISTS public.clinical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_record_id UUID NOT NULL REFERENCES public.clinical_records(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinical_documents_own" ON public.clinical_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clinical_records cr
      WHERE cr.id = clinical_record_id AND cr.user_id = auth.uid()
    )
  );

-- =============================================
-- storage_cleanup_queue
-- =============================================
CREATE TABLE IF NOT EXISTS public.storage_cleanup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  record_type TEXT DEFAULT 'clinical_document',
  record_id UUID,
  attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  failed_permanently BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- share_tokens
-- =============================================
CREATE TABLE IF NOT EXISTS public.share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Storage bucket: clinical-docs (privado)
-- Crear manualmente en Supabase Dashboard o via API:
-- POST /storage/v1/bucket { "id": "clinical-docs", "name": "clinical-docs", "public": false, "fileSizeLimit": 10485760 }
-- =============================================
