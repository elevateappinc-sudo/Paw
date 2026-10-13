-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 1 · Backfill de vacunas antiguas en el motor de ciclos
-- La tabla vaccines se conserva en solo lectura (los módulos viejos la leen);
-- la UI nueva usa care_cycles kind='vaccine'.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.vaccines ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES public.care_cycles(id) ON DELETE SET NULL;

DO $$
DECLARE v RECORD; v_cycle UUID; v_interval INT;
BEGIN
  FOR v IN SELECT * FROM public.vaccines WHERE cycle_id IS NULL ORDER BY fecha_aplicacion LOOP
    v_interval := COALESCE(v.proxima_fecha - v.fecha_aplicacion, 365);
    IF v_interval <= 0 THEN v_interval := 365; END IF;

    SELECT id INTO v_cycle FROM public.care_cycles
     WHERE pet_id = v.pet_id AND kind = 'vaccine' AND lower(name) = lower(v.nombre) LIMIT 1;

    IF v_cycle IS NULL THEN
      INSERT INTO public.care_cycles (pet_id, user_id, kind, name, interval_days, last_done_at, next_due_at, notes, source)
      VALUES (v.pet_id, v.user_id, 'vaccine', v.nombre, v_interval, v.fecha_aplicacion,
              COALESCE(v.proxima_fecha, v.fecha_aplicacion + v_interval), v.notas, 'legacy')
      RETURNING id INTO v_cycle;
    END IF;

    -- el trigger recalcula last_done_at / next_due_at con la fecha más reciente
    INSERT INTO public.care_cycle_logs (cycle_id, pet_id, user_id, done_at, notes, created_at)
    VALUES (v_cycle, v.pet_id, v.user_id, v.fecha_aplicacion, NULLIF(concat_ws(' · ', v.veterinario, v.notas), ''), v.created_at);

    UPDATE public.vaccines SET cycle_id = v_cycle WHERE id = v.id;
  END LOOP;
END $$;

-- Generar ciclos de catálogo para mascotas que existían antes del motor
DO $$ DECLARE p RECORD; BEGIN
  FOR p IN SELECT id FROM public.pets LOOP
    PERFORM public.generate_care_cycles_for_pet(p.id);
  END LOOP;
END $$;
