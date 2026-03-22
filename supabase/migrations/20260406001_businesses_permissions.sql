-- Plataforma Administrativa PAW: businesses + pet_members + permissions
-- NOTA: Este archivo refleja el schema real de la DB.
-- La DB usa: owner_id (no owner_user_id), qr_token (no qr_code), member_id (no user_id)

-- Habilitar RLS en tablas existentes (pueden ya existir)
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pet_members ENABLE ROW LEVEL SECURITY;

-- RLS businesses: solo el owner puede ver/editar su negocio
DO $$ BEGIN
  CREATE POLICY "businesses_own" ON public.businesses FOR ALL USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS pet_members: owner de mascota gestiona, invitado ve su propio row
DO $$ BEGIN
  CREATE POLICY "pet_members_owner" ON public.pet_members FOR ALL
    USING (EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "pet_members_self" ON public.pet_members FOR SELECT
    USING (member_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabla pet_member_permissions (granular por módulo)
CREATE TABLE IF NOT EXISTS public.pet_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_member_id UUID NOT NULL REFERENCES public.pet_members(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('vacunas','historial_clinico','medicamentos','entrenamiento','gastos','itinerario','fotos','notificaciones')),
  permission TEXT NOT NULL CHECK (permission IN ('view','edit')),
  UNIQUE(pet_member_id, module)
);

ALTER TABLE public.pet_member_permissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "permissions_owner" ON public.pet_member_permissions FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.pet_members pm
      JOIN public.pets p ON p.id = pm.pet_id
      WHERE pm.id = pet_member_id AND p.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "permissions_self" ON public.pet_member_permissions FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.pet_members WHERE id = pet_member_id AND member_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_qr ON public.businesses(qr_token);
CREATE INDEX IF NOT EXISTS idx_pet_members_pet ON public.pet_members(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_members_member ON public.pet_members(member_id);

-- Trigger: grant_initial_permissions para co_owner al aceptar invitación
CREATE OR REPLACE FUNCTION public.grant_initial_permissions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status = 'pending' AND NEW.role = 'co_owner' THEN
    INSERT INTO public.pet_member_permissions (pet_member_id, module, permission)
    SELECT NEW.id, unnest(ARRAY['vacunas','historial_clinico','medicamentos','entrenamiento','gastos','itinerario','fotos','notificaciones']), 'edit'
    ON CONFLICT (pet_member_id, module) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_pet_member_accepted ON public.pet_members;
CREATE TRIGGER on_pet_member_accepted
  AFTER UPDATE ON public.pet_members
  FOR EACH ROW EXECUTE FUNCTION public.grant_initial_permissions();
