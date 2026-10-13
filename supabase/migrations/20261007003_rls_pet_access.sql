-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 1 · RLS por mascota: dueño o miembro con permiso
-- Un miembro invitado (pet_members.status='active') ve y edita según
-- pet_member_permissions. Sustituye a las políticas user_id = auth.uid().
-- ─────────────────────────────────────────────────────────────────────────────

-- Ampliar módulos permitidos
ALTER TABLE public.pet_member_permissions DROP CONSTRAINT IF EXISTS pet_member_permissions_module_check;
ALTER TABLE public.pet_member_permissions ADD CONSTRAINT pet_member_permissions_module_check
  CHECK (module IN ('vacunas','historial_clinico','medicamentos','entrenamiento','gastos','itinerario','fotos','notificaciones','salud','alimentacion','higiene','peso'));

CREATE OR REPLACE FUNCTION public.can_access_pet(p_pet_id UUID, p_module TEXT DEFAULT NULL, p_perm TEXT DEFAULT 'view')
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pets p WHERE p.id = p_pet_id AND p.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1
      FROM public.pet_members m
      LEFT JOIN public.pet_member_permissions pm ON pm.pet_member_id = m.id
     WHERE m.pet_id = p_pet_id
       AND m.user_id = auth.uid()
       AND m.status = 'active'
       AND (
         p_module IS NULL
         OR (pm.module = p_module AND (p_perm = 'view' OR pm.permission = 'edit'))
         -- co-dueño sin permisos específicos: acceso total
         OR (m.role = 'co_owner' AND pm.id IS NULL)
       )
  );
$$;

-- pets: el dueño todo; miembros activos pueden ver y editar datos básicos
DROP POLICY IF EXISTS "pets_select_own" ON public.pets;
DROP POLICY IF EXISTS "pets_member_select" ON public.pets;
CREATE POLICY "pets_select_access" ON public.pets FOR SELECT USING (public.can_access_pet(id));
DROP POLICY IF EXISTS "pets_update_own" ON public.pets;
CREATE POLICY "pets_update_access" ON public.pets FOR UPDATE USING (public.can_access_pet(id, NULL, 'edit'));

-- helper para reescribir políticas de tablas con pet_id directo
DO $$
DECLARE
  t RECORD;
  tables TEXT[][] := ARRAY[
    ARRAY['expenses','gastos'],
    ARRAY['training_sessions','entrenamiento'],
    ARRAY['vaccines','vacunas'],
    ARRAY['itinerary','itinerario'],
    ARRAY['itinerary_records','itinerario'],
    ARRAY['medications','medicamentos'],
    ARRAY['medication_logs','medicamentos'],
    ARRAY['clinical_records','historial_clinico'],
    ARRAY['pet_photos','fotos'],
    ARRAY['pet_videos','fotos'],
    ARRAY['care_cycles','salud'],
    ARRAY['care_cycle_logs','salud'],
    ARRAY['weight_logs','peso']
  ];
  i INT;
  tbl TEXT; mod TEXT; pol RECORD;
BEGIN
  FOR i IN 1..array_length(tables, 1) LOOP
    tbl := tables[i][1]; mod := tables[i][2];
    IF to_regclass('public.' || tbl) IS NULL THEN CONTINUE; END IF;
    -- borrar políticas existentes de la tabla
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (public.can_access_pet(pet_id, %L, ''view''))', tbl || '_select', tbl, mod);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.can_access_pet(pet_id, %L, ''edit''))', tbl || '_insert', tbl, mod);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (public.can_access_pet(pet_id, %L, ''edit''))', tbl || '_update', tbl, mod);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (public.can_access_pet(pet_id, %L, ''edit''))', tbl || '_delete', tbl, mod);
  END LOOP;
END $$;

-- Tablas hijas sin pet_id directo
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' AND tablename IN ('training_tasks','clinical_documents') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public.training_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_tasks_access" ON public.training_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.training_sessions s WHERE s.id = session_id AND public.can_access_pet(s.pet_id, 'entrenamiento', 'view')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.training_sessions s WHERE s.id = session_id AND public.can_access_pet(s.pet_id, 'entrenamiento', 'edit')));

ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinical_documents_access" ON public.clinical_documents FOR ALL
  USING (EXISTS (SELECT 1 FROM public.clinical_records r WHERE r.id = clinical_record_id AND public.can_access_pet(r.pet_id, 'historial_clinico', 'view')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clinical_records r WHERE r.id = clinical_record_id AND public.can_access_pet(r.pet_id, 'historial_clinico', 'edit')));

-- shared_with deja de usarse: pet_members es la única fuente de verdad
ALTER TABLE public.pets DROP COLUMN IF EXISTS shared_with;
