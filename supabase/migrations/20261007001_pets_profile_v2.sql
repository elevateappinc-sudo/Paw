-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 1 · Perfil de mascota v2 + registro de peso
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('male','female','unknown')) DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS neutered BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS microchip TEXT,
  ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS conditions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS blood_type TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact JSONB,          -- {"name":"","phone":""}
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN ('low','medium','high')) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS food JSONB;                       -- ver types/db.ts PetFood

COMMENT ON COLUMN public.pets.food IS 'PetFood: {brand, product, bag_kg, opened_at, grams_per_day, meals:[{time,grams}], notes}';

CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0),
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_weight_logs_pet_date ON public.weight_logs(pet_id, measured_at DESC);

-- Mantener pets.weight sincronizado con el último registro
CREATE OR REPLACE FUNCTION public.sync_pet_weight()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.pets p
     SET weight = (SELECT weight_kg FROM public.weight_logs w WHERE w.pet_id = COALESCE(NEW.pet_id, OLD.pet_id) ORDER BY measured_at DESC, created_at DESC LIMIT 1),
         updated_at = now()
   WHERE p.id = COALESCE(NEW.pet_id, OLD.pet_id);
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_sync_pet_weight ON public.weight_logs;
CREATE TRIGGER trg_sync_pet_weight AFTER INSERT OR UPDATE OR DELETE ON public.weight_logs
  FOR EACH ROW EXECUTE FUNCTION public.sync_pet_weight();

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
-- Las políticas definitivas (por miembro de la mascota) llegan en 20261007003_rls_pet_access.sql
