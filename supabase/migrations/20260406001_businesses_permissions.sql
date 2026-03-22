-- Plataforma Administrativa PAW: businesses + pet_members + permissions

-- Crear tablas
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('veterinaria','peluqueria','entrenamiento','tienda','otro')),
  description TEXT,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  address TEXT,
  logo_url TEXT,
  qr_code TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.users(id),
  role TEXT NOT NULL CHECK (role IN ('co_owner','service_provider')),
  service_type TEXT CHECK (service_type IN ('vet','groomer','trainer','delivery','other')),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','revoked')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pet_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.pet_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_member_id UUID NOT NULL REFERENCES public.pet_members(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('vacunas','historial_clinico','medicamentos','entrenamiento','gastos','itinerario','fotos','notificaciones')),
  permission TEXT NOT NULL CHECK (permission IN ('view','edit')),
  UNIQUE(pet_member_id, module)
);

-- RLS: businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='businesses' AND policyname='businesses_own') THEN
    CREATE POLICY "businesses_own" ON public.businesses FOR ALL USING (owner_user_id = auth.uid());
  END IF;
END $$;

-- RLS: pet_members
ALTER TABLE public.pet_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pet_members' AND policyname='pet_members_owner') THEN
    CREATE POLICY "pet_members_owner" ON public.pet_members FOR ALL
      USING (EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND user_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pet_members' AND policyname='pet_members_self') THEN
    CREATE POLICY "pet_members_self" ON public.pet_members FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- RLS: pet_member_permissions
ALTER TABLE public.pet_member_permissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pet_member_permissions' AND policyname='permissions_owner') THEN
    CREATE POLICY "permissions_owner" ON public.pet_member_permissions FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.pet_members pm
        JOIN public.pets p ON p.id = pm.pet_id
        WHERE pm.id = pet_member_id AND p.user_id = auth.uid()
      ));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pet_member_permissions' AND policyname='permissions_self') THEN
    CREATE POLICY "permissions_self" ON public.pet_member_permissions FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.pet_members WHERE id = pet_member_id AND user_id = auth.uid()));
  END IF;
END $$;

-- Función y trigger para permisos automáticos al aceptar co_owner
CREATE OR REPLACE FUNCTION public.grant_initial_permissions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status = 'pending' AND NEW.role = 'co_owner' THEN
    INSERT INTO public.pet_member_permissions (pet_member_id, module, permission)
    SELECT NEW.id,
           unnest(ARRAY['vacunas','historial_clinico','medicamentos','entrenamiento','gastos','itinerario','fotos','notificaciones']),
           'edit'
    ON CONFLICT (pet_member_id, module) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_pet_member_accepted ON public.pet_members;
CREATE TRIGGER on_pet_member_accepted
  AFTER UPDATE ON public.pet_members
  FOR EACH ROW EXECUTE FUNCTION public.grant_initial_permissions();
