-- PAW · Sprint 2 · F-MEDICATIONS
-- Medicamentos + Logs de administración

CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose_amount NUMERIC(10,3) NOT NULL,
  dose_unit TEXT NOT NULL,
  frequency_value INT NOT NULL,
  frequency_unit TEXT NOT NULL CHECK (frequency_unit IN ('hours','days','times_per_day','weekly')),
  start_date DATE NOT NULL,
  end_date DATE,
  duration_days INT,
  vet_name TEXT,
  reason TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'medications' AND policyname = 'medications_own'
  ) THEN
    CREATE POLICY "medications_own" ON public.medications FOR ALL USING (user_id = auth.uid());
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  administered_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','administered','missed','skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'medication_logs' AND policyname = 'medication_logs_own'
  ) THEN
    CREATE POLICY "medication_logs_own" ON public.medication_logs FOR ALL USING (user_id = auth.uid());
  END IF;
END$$;
