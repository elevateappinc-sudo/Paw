-- ─────────────────────────────────────────────────────────────────────────────
-- Compartir mascota: invitaciones por enlace (WhatsApp, SMS, copiar). El enlace
-- lleva al inicio de sesión; al entrar o registrarse se acepta solo.
-- Quien acepta queda como co-dueño activo sin permisos específicos, que según
-- can_access_pet() equivale a ver y editar lo mismo que el dueño.
-- Cada invitación sirve una sola vez y vence a los 30 días.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pet_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id      UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  invited_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(18), 'hex'),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  accepted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days'
);
CREATE INDEX IF NOT EXISTS pet_invitations_pet_idx ON public.pet_invitations(pet_id);

ALTER TABLE public.pet_invitations ENABLE ROW LEVEL SECURITY;

-- Solo el dueño de la mascota crea, ve y revoca invitaciones
DROP POLICY IF EXISTS pet_invitations_owner ON public.pet_invitations;
CREATE POLICY pet_invitations_owner ON public.pet_invitations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_id AND p.user_id = auth.uid()))
  WITH CHECK (invited_by = auth.uid() AND EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_id AND p.user_id = auth.uid()));

-- Vista previa pública de una invitación (la página /invitacion/[token] la
-- muestra antes de iniciar sesión). Expone solo nombre, especie y foto.
CREATE OR REPLACE FUNCTION public.get_pet_invitation(p_token TEXT)
RETURNS TABLE (pet_name TEXT, species TEXT, photo_url TEXT, inviter_name TEXT, status TEXT, expired BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.name, p.species::TEXT, p.photo_url, u.display_name, i.status, i.expires_at < now()
    FROM public.pet_invitations i
    JOIN public.pets p ON p.id = i.pet_id
    LEFT JOIN public.users u ON u.id = i.invited_by
   WHERE i.token = p_token;
$$;
REVOKE ALL ON FUNCTION public.get_pet_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pet_invitation(TEXT) TO anon, authenticated;

-- Aceptar: crea (o reactiva) el acceso como co-dueño y marca la invitación usada.
-- Devuelve el id de la mascota. Errores: invalid, expired, used, own_pet.
CREATE OR REPLACE FUNCTION public.accept_pet_invitation(p_token TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_inv public.pet_invitations%ROWTYPE;
  v_owner UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT * INTO v_inv FROM public.pet_invitations WHERE token = p_token FOR UPDATE;
  IF NOT FOUND OR v_inv.status = 'revoked' THEN RAISE EXCEPTION 'invalid'; END IF;

  SELECT user_id INTO v_owner FROM public.pets WHERE id = v_inv.pet_id;
  IF v_owner = v_uid THEN RAISE EXCEPTION 'own_pet'; END IF;

  IF v_inv.status = 'accepted' THEN
    -- Volver a abrir el enlace con la misma cuenta no es un error
    IF v_inv.accepted_by = v_uid THEN RETURN v_inv.pet_id; END IF;
    RAISE EXCEPTION 'used';
  END IF;
  IF v_inv.expires_at < now() THEN RAISE EXCEPTION 'expired'; END IF;

  INSERT INTO public.pet_members (pet_id, user_id, invited_by, role, status, accepted_at)
  VALUES (v_inv.pet_id, v_uid, v_inv.invited_by, 'co_owner', 'active', now())
  ON CONFLICT (pet_id, user_id) DO UPDATE
    SET role = 'co_owner', status = 'active', accepted_at = now(), invited_by = EXCLUDED.invited_by;

  -- Co-dueño sin permisos específicos = acceso total (can_access_pet)
  DELETE FROM public.pet_member_permissions pm
   USING public.pet_members m
   WHERE pm.pet_member_id = m.id AND m.pet_id = v_inv.pet_id AND m.user_id = v_uid;

  UPDATE public.pet_invitations
     SET status = 'accepted', accepted_by = v_uid, accepted_at = now()
   WHERE id = v_inv.id;

  INSERT INTO public.notifications (user_id, pet_id, tipo, titulo, mensaje)
  SELECT v_inv.invited_by, v_inv.pet_id, 'nota',
         COALESCE(u.display_name, 'Alguien') || ' ya ve a ' || p.name,
         'Aceptó tu invitación y ahora comparten su cuidado.'
    FROM public.pets p LEFT JOIN public.users u ON u.id = v_uid
   WHERE p.id = v_inv.pet_id;

  RETURN v_inv.pet_id;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_pet_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_pet_invitation(TEXT) TO authenticated;

-- Personas con acceso, con nombre y correo (users solo deja leer el propio).
-- Solo el dueño o un miembro activo pueden consultarla.
CREATE OR REPLACE FUNCTION public.pet_member_profiles(p_pet_id UUID)
RETURNS TABLE (member_id UUID, user_id UUID, display_name TEXT, email TEXT, avatar_url TEXT, role TEXT, status TEXT, is_owner BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NULL::UUID, u.id, u.display_name, u.email, u.avatar_url, 'owner', 'active', TRUE
    FROM public.pets p JOIN public.users u ON u.id = p.user_id
   WHERE p.id = p_pet_id AND public.can_access_pet(p_pet_id)
  UNION ALL
  SELECT m.id, u.id, u.display_name, u.email, u.avatar_url, m.role, m.status, FALSE
    FROM public.pet_members m JOIN public.users u ON u.id = m.user_id
   WHERE m.pet_id = p_pet_id AND m.status <> 'revoked' AND public.can_access_pet(p_pet_id);
$$;
REVOKE ALL ON FUNCTION public.pet_member_profiles(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pet_member_profiles(UUID) TO authenticated;

-- Un miembro puede salirse por su cuenta
DROP POLICY IF EXISTS pet_members_self_leave ON public.pet_members;
CREATE POLICY pet_members_self_leave ON public.pet_members FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND status = 'revoked');

-- Tiempo real: la foto y los datos de la mascota se actualizan al instante
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pets;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pet_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pet_members;
  END IF;
END $$;

