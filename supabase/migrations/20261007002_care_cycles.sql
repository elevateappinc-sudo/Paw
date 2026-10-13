-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 1 · Motor de ciclos de cuidado
-- Vacunas, antiparasitarios, higiene, recompra de alimento y chequeos son
-- instancias del mismo mecanismo: un ciclo con intervalo y próxima fecha.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE care_cycle_kind AS ENUM (
    'vaccine','deworm_internal','deworm_external','bath','grooming','nails','ears','dental',
    'food_restock','checkup','weight','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE life_stage AS ENUM ('puppy','adult','senior');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Catálogo de protocolos por especie y etapa ----------------------------------
CREATE TABLE IF NOT EXISTS public.care_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species pet_species NOT NULL,
  stage life_stage NOT NULL,
  kind care_cycle_kind NOT NULL,
  name TEXT NOT NULL,
  interval_days INT NOT NULL CHECK (interval_days > 0),
  start_age_days INT NOT NULL DEFAULT 0,      -- desde qué edad aplica
  end_age_days INT,                           -- hasta qué edad (NULL = siempre)
  first_due_offset_days INT NOT NULL DEFAULT 0, -- días desde el alta para la primera fecha
  notes TEXT,
  sort INT NOT NULL DEFAULT 100
);
ALTER TABLE public.care_protocols ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "protocols_read_all" ON public.care_protocols;
CREATE POLICY "protocols_read_all" ON public.care_protocols FOR SELECT USING (true);

-- Ciclos por mascota ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.care_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind care_cycle_kind NOT NULL,
  name TEXT NOT NULL,
  interval_days INT NOT NULL CHECK (interval_days > 0),
  last_done_at DATE,
  next_due_at DATE NOT NULL,
  product TEXT,
  dose TEXT,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','catalog','business','legacy')),
  protocol_id UUID REFERENCES public.care_protocols(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_care_cycles_pet_due ON public.care_cycles(pet_id, next_due_at) WHERE active;
CREATE INDEX IF NOT EXISTS idx_care_cycles_due ON public.care_cycles(next_due_at) WHERE active;

CREATE TABLE IF NOT EXISTS public.care_cycle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.care_cycles(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  done_at DATE NOT NULL DEFAULT CURRENT_DATE,
  product TEXT,
  dose TEXT,
  cost NUMERIC(12,2),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  booking_id UUID,                          -- FK se añade en Fase 2
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_care_cycle_logs_pet_date ON public.care_cycle_logs(pet_id, done_at DESC);
CREATE INDEX IF NOT EXISTS idx_care_cycle_logs_cycle ON public.care_cycle_logs(cycle_id, done_at DESC);

ALTER TABLE public.care_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_cycle_logs ENABLE ROW LEVEL SECURITY;

-- Al registrar una aplicación, recalcular el ciclo ------------------------------
CREATE OR REPLACE FUNCTION public.on_care_cycle_log_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_interval INT;
BEGIN
  SELECT interval_days INTO v_interval FROM public.care_cycles WHERE id = NEW.cycle_id;
  UPDATE public.care_cycles
     SET last_done_at = GREATEST(COALESCE(last_done_at, NEW.done_at), NEW.done_at),
         next_due_at  = NEW.done_at + v_interval,
         product      = COALESCE(NEW.product, product),
         dose         = COALESCE(NEW.dose, dose),
         updated_at   = now()
   WHERE id = NEW.cycle_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_care_cycle_log_insert ON public.care_cycle_logs;
CREATE TRIGGER trg_care_cycle_log_insert AFTER INSERT ON public.care_cycle_logs
  FOR EACH ROW EXECUTE FUNCTION public.on_care_cycle_log_insert();

-- Etapa de vida según edad ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.life_stage_for(p_species pet_species, p_birth DATE)
RETURNS life_stage LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE age_days INT;
BEGIN
  IF p_birth IS NULL THEN RETURN 'adult'; END IF;
  age_days := CURRENT_DATE - p_birth;
  IF age_days < 365 THEN RETURN 'puppy'; END IF;
  IF p_species = 'perro' AND age_days >= 365*7 THEN RETURN 'senior'; END IF;
  IF p_species = 'gato'  AND age_days >= 365*10 THEN RETURN 'senior'; END IF;
  RETURN 'adult';
END $$;

-- Generar ciclos por defecto para una mascota ----------------------------------
CREATE OR REPLACE FUNCTION public.generate_care_cycles_for_pet(p_pet_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pet RECORD;
  v_stage life_stage;
  v_age INT;
  v_proto RECORD;
  v_count INT := 0;
BEGIN
  SELECT * INTO v_pet FROM public.pets WHERE id = p_pet_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  v_stage := public.life_stage_for(v_pet.species, v_pet.birth_date);
  v_age := COALESCE(CURRENT_DATE - v_pet.birth_date, 365*3);

  FOR v_proto IN
    SELECT * FROM public.care_protocols
     WHERE species = v_pet.species
       AND stage = v_stage
       AND start_age_days <= v_age
       AND (end_age_days IS NULL OR end_age_days >= v_age)
     ORDER BY sort
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.care_cycles c WHERE c.pet_id = p_pet_id AND c.kind = v_proto.kind AND c.name = v_proto.name) THEN
      INSERT INTO public.care_cycles (pet_id, user_id, kind, name, interval_days, next_due_at, notes, source, protocol_id)
      VALUES (p_pet_id, v_pet.user_id, v_proto.kind, v_proto.name, v_proto.interval_days,
              CURRENT_DATE + v_proto.first_due_offset_days, v_proto.notes, 'catalog', v_proto.id);
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION public.on_pet_created_generate_cycles()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.generate_care_cycles_for_pet(NEW.id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_pet_created_generate_cycles ON public.pets;
CREATE TRIGGER trg_pet_created_generate_cycles AFTER INSERT ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.on_pet_created_generate_cycles();

-- Marcar ciclo como hecho (RPC para la UI) --------------------------------------
CREATE OR REPLACE FUNCTION public.complete_care_cycle(
  p_cycle_id UUID,
  p_done_at DATE DEFAULT CURRENT_DATE,
  p_product TEXT DEFAULT NULL,
  p_dose TEXT DEFAULT NULL,
  p_cost NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_business_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cycle RECORD; v_log_id UUID;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'cycle not found'; END IF;
  IF NOT public.can_access_pet(v_cycle.pet_id, 'salud', 'edit') THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.care_cycle_logs (cycle_id, pet_id, user_id, done_at, product, dose, cost, notes, business_id)
  VALUES (p_cycle_id, v_cycle.pet_id, auth.uid(), p_done_at, p_product, p_dose, p_cost, p_notes, p_business_id)
  RETURNING id INTO v_log_id;
  IF p_cost IS NOT NULL AND p_cost > 0 THEN
    INSERT INTO public.expenses (pet_id, user_id, monto, fecha, categoria, descripcion, quien_pago)
    VALUES (v_cycle.pet_id, auth.uid(), p_cost, p_done_at, 'Salud', v_cycle.name, 'Yo');
  END IF;
  RETURN v_log_id;
END $$;

-- Protección contra recordatorios duplicados en la cola -------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_queue_care_cycle
  ON public.notification_queue ((data->>'cycle_id'), (data->>'due_at'), (data->>'offset_days'))
  WHERE type = 'care_cycle';

-- ─── Semilla de protocolos (perro y gato) ────────────────────────────────────
INSERT INTO public.care_protocols (species, stage, kind, name, interval_days, start_age_days, end_age_days, first_due_offset_days, notes, sort) VALUES
-- Perro cachorro
('perro','puppy','vaccine','Polivalente (múltiple)',21,42,120,7,'3 dosis entre las 6 y 16 semanas',10),
('perro','puppy','vaccine','Antirrábica',365,84,NULL,14,'Primera dosis desde las 12 semanas, refuerzo anual',11),
('perro','puppy','deworm_internal','Desparasitación interna',15,14,180,0,'Cada 15 días hasta los 6 meses',20),
('perro','puppy','deworm_external','Antipulgas y garrapatas',30,56,NULL,0,'Producto según peso',21),
('perro','puppy','weight','Control de peso',7,0,365,0,'Semanal mientras crece',30),
('perro','puppy','bath','Baño',21,60,NULL,14,NULL,40),
('perro','puppy','nails','Uñas',21,60,NULL,14,NULL,41),
('perro','puppy','dental','Dientes',1,90,NULL,0,'Cepillado diario',42),
('perro','puppy','checkup','Control veterinario',90,0,NULL,30,NULL,50),
-- Perro adulto
('perro','adult','vaccine','Polivalente (múltiple)',365,365,NULL,30,'Refuerzo anual',10),
('perro','adult','vaccine','Antirrábica',365,365,NULL,30,'Refuerzo anual',11),
('perro','adult','vaccine','Tos de las perreras',365,365,NULL,30,NULL,12),
('perro','adult','deworm_internal','Desparasitación interna',90,365,NULL,0,'Cada 3 meses',20),
('perro','adult','deworm_external','Antipulgas y garrapatas',30,365,NULL,0,'Producto según peso',21),
('perro','adult','weight','Control de peso',30,365,NULL,0,NULL,30),
('perro','adult','bath','Baño',21,365,NULL,7,NULL,40),
('perro','adult','grooming','Corte de pelo',56,365,NULL,21,'Según raza',41),
('perro','adult','nails','Uñas',21,365,NULL,7,NULL,42),
('perro','adult','ears','Oídos',7,365,NULL,0,'Limpieza semanal',43),
('perro','adult','dental','Dientes',1,365,NULL,0,'Cepillado diario',44),
('perro','adult','checkup','Control veterinario',365,365,NULL,60,'Chequeo anual',50),
-- Perro senior
('perro','senior','vaccine','Polivalente (múltiple)',365,2555,NULL,30,'Refuerzo anual',10),
('perro','senior','vaccine','Antirrábica',365,2555,NULL,30,'Refuerzo anual',11),
('perro','senior','deworm_internal','Desparasitación interna',90,2555,NULL,0,NULL,20),
('perro','senior','deworm_external','Antipulgas y garrapatas',30,2555,NULL,0,NULL,21),
('perro','senior','weight','Control de peso',14,2555,NULL,0,'Quincenal en senior',30),
('perro','senior','bath','Baño',28,2555,NULL,7,NULL,40),
('perro','senior','nails','Uñas',21,2555,NULL,7,NULL,42),
('perro','senior','dental','Dientes',1,2555,NULL,0,NULL,44),
('perro','senior','checkup','Control veterinario',180,2555,NULL,30,'Chequeo semestral con analítica',50),
-- Gato cachorro
('gato','puppy','vaccine','Triple felina',21,56,120,7,'3 dosis entre las 8 y 16 semanas',10),
('gato','puppy','vaccine','Antirrábica',365,84,NULL,14,NULL,11),
('gato','puppy','deworm_internal','Desparasitación interna',15,14,180,0,'Cada 15 días hasta los 6 meses',20),
('gato','puppy','deworm_external','Antipulgas',30,56,NULL,0,'Pipeta para gatitos',21),
('gato','puppy','weight','Control de peso',7,0,365,0,NULL,30),
('gato','puppy','nails','Uñas',21,60,NULL,14,NULL,42),
('gato','puppy','dental','Dientes',1,90,NULL,0,NULL,44),
('gato','puppy','checkup','Control veterinario',90,0,NULL,30,NULL,50),
-- Gato adulto
('gato','adult','vaccine','Triple felina',365,365,NULL,30,'Refuerzo anual',10),
('gato','adult','vaccine','Antirrábica',365,365,NULL,30,NULL,11),
('gato','adult','vaccine','Leucemia felina',365,365,NULL,30,'Si sale de casa',12),
('gato','adult','deworm_internal','Desparasitación interna',90,365,NULL,0,NULL,20),
('gato','adult','deworm_external','Antipulgas',30,365,NULL,0,NULL,21),
('gato','adult','weight','Control de peso',30,365,NULL,0,NULL,30),
('gato','adult','grooming','Cepillado',7,365,NULL,0,'Semanal, diario en pelo largo',41),
('gato','adult','nails','Uñas',21,365,NULL,7,NULL,42),
('gato','adult','dental','Dientes',1,365,NULL,0,NULL,44),
('gato','adult','checkup','Control veterinario',365,365,NULL,60,NULL,50),
-- Gato senior
('gato','senior','vaccine','Triple felina',365,3650,NULL,30,NULL,10),
('gato','senior','vaccine','Antirrábica',365,3650,NULL,30,NULL,11),
('gato','senior','deworm_internal','Desparasitación interna',90,3650,NULL,0,NULL,20),
('gato','senior','deworm_external','Antipulgas',30,3650,NULL,0,NULL,21),
('gato','senior','weight','Control de peso',14,3650,NULL,0,NULL,30),
('gato','senior','nails','Uñas',21,3650,NULL,7,NULL,42),
('gato','senior','dental','Dientes',1,3650,NULL,0,NULL,44),
('gato','senior','checkup','Control veterinario',180,3650,NULL,30,'Semestral con analítica renal',50),
-- Otras especies: mínimo común
('conejo','adult','deworm_external','Antiparasitario',90,0,NULL,0,NULL,21),
('conejo','adult','nails','Uñas',30,0,NULL,7,NULL,42),
('conejo','adult','checkup','Control veterinario',180,0,NULL,30,NULL,50),
('ave','adult','checkup','Control veterinario',180,0,NULL,30,NULL,50),
('ave','adult','nails','Uñas y pico',60,0,NULL,14,NULL,42),
('otro','adult','checkup','Control veterinario',180,0,NULL,30,NULL,50)
ON CONFLICT DO NOTHING;
