-- Frecuencia parametrizable por el usuario: valor + unidad (días, semanas, meses).
-- interval_days sigue siendo la fuente para el cálculo de fechas (1 mes = 30 días).
ALTER TABLE public.care_cycles
  ADD COLUMN IF NOT EXISTS interval_value INT,
  ADD COLUMN IF NOT EXISTS interval_unit TEXT NOT NULL DEFAULT 'days' CHECK (interval_unit IN ('days','weeks','months'));

UPDATE public.care_cycles
   SET interval_value = CASE
         WHEN interval_days % 30 = 0 AND interval_days >= 30 THEN interval_days / 30
         WHEN interval_days % 7 = 0 AND interval_days >= 7 THEN interval_days / 7
         ELSE interval_days END,
       interval_unit = CASE
         WHEN interval_days % 30 = 0 AND interval_days >= 30 THEN 'months'
         WHEN interval_days % 7 = 0 AND interval_days >= 7 THEN 'weeks'
         ELSE 'days' END
 WHERE interval_value IS NULL;

-- Mantener interval_days coherente cuando la UI cambia valor y unidad
CREATE OR REPLACE FUNCTION public.sync_care_cycle_interval()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.interval_value IS NOT NULL THEN
    NEW.interval_days := NEW.interval_value * CASE NEW.interval_unit WHEN 'months' THEN 30 WHEN 'weeks' THEN 7 ELSE 1 END;
  END IF;
  IF NEW.interval_days < 1 THEN NEW.interval_days := 1; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sync_care_cycle_interval ON public.care_cycles;
CREATE TRIGGER trg_sync_care_cycle_interval BEFORE INSERT OR UPDATE ON public.care_cycles
  FOR EACH ROW EXECUTE FUNCTION public.sync_care_cycle_interval();

-- Los protocolos también llevan unidad para mostrarla al generar el plan
ALTER TABLE public.care_protocols ADD COLUMN IF NOT EXISTS interval_unit TEXT NOT NULL DEFAULT 'days' CHECK (interval_unit IN ('days','weeks','months'));
UPDATE public.care_protocols SET interval_unit = CASE WHEN interval_days % 30 = 0 AND interval_days >= 30 THEN 'months' WHEN interval_days % 7 = 0 AND interval_days >= 7 THEN 'weeks' ELSE 'days' END;

-- generate_care_cycles_for_pet copia la unidad del protocolo
CREATE OR REPLACE FUNCTION public.generate_care_cycles_for_pet(p_pet_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pet RECORD; v_stage life_stage; v_age INT; v_proto RECORD; v_count INT := 0;
BEGIN
  SELECT * INTO v_pet FROM public.pets WHERE id = p_pet_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  v_stage := public.life_stage_for(v_pet.species, v_pet.birth_date);
  v_age := COALESCE(CURRENT_DATE - v_pet.birth_date, 365*3);
  FOR v_proto IN
    SELECT * FROM public.care_protocols
     WHERE species = v_pet.species AND stage = v_stage AND start_age_days <= v_age AND (end_age_days IS NULL OR end_age_days >= v_age)
     ORDER BY sort
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.care_cycles c WHERE c.pet_id = p_pet_id AND c.kind = v_proto.kind AND c.name = v_proto.name) THEN
      INSERT INTO public.care_cycles (pet_id, user_id, kind, name, interval_days, interval_unit, interval_value, next_due_at, notes, source, protocol_id)
      VALUES (p_pet_id, v_pet.user_id, v_proto.kind, v_proto.name, v_proto.interval_days, v_proto.interval_unit,
              v_proto.interval_days / CASE v_proto.interval_unit WHEN 'months' THEN 30 WHEN 'weeks' THEN 7 ELSE 1 END,
              CURRENT_DATE + v_proto.first_due_offset_days, v_proto.notes, 'catalog', v_proto.id);
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END $$;
