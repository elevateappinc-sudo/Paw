-- Al insertar una mascota con RETURNING, la política SELECT se evalúa en la misma
-- sentencia y can_access_pet (STABLE) no ve la fila nueva. El dueño pasa directo.
DROP POLICY IF EXISTS "pets_select_access" ON public.pets;
CREATE POLICY "pets_select_access" ON public.pets FOR SELECT
  USING (user_id = auth.uid() OR public.can_access_pet(id));

DROP POLICY IF EXISTS "pets_update_access" ON public.pets;
CREATE POLICY "pets_update_access" ON public.pets FOR UPDATE
  USING (user_id = auth.uid() OR public.can_access_pet(id, NULL, 'edit'))
  WITH CHECK (user_id = auth.uid() OR public.can_access_pet(id, NULL, 'edit'));
