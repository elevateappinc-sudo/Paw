-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 3 · Mascota perdida, ficha de emergencia pública y asistente
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lost_pet_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','found','cancelled')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location geography(Point, 4326),
  radius_m INT NOT NULL DEFAULT 3000,
  address TEXT,
  message TEXT,
  contact_phone TEXT,
  photo_url TEXT,
  reward NUMERIC(12,2),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.sync_lost_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  IF NEW.status <> 'active' AND NEW.resolved_at IS NULL THEN NEW.resolved_at := now(); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_lost_location ON public.lost_pet_alerts;
CREATE TRIGGER trg_lost_location BEFORE INSERT OR UPDATE ON public.lost_pet_alerts
  FOR EACH ROW EXECUTE FUNCTION public.sync_lost_location();
CREATE INDEX IF NOT EXISTS idx_lost_active_location ON public.lost_pet_alerts USING GIST (location) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.lost_pet_sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.lost_pet_alerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  message TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lost_pet_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lost_select_auth" ON public.lost_pet_alerts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "lost_manage_own" ON public.lost_pet_alerts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.can_access_pet(pet_id));
ALTER TABLE public.lost_pet_sightings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sightings_select" ON public.lost_pet_sightings FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.lost_pet_alerts a WHERE a.id = alert_id AND a.user_id = auth.uid()));
CREATE POLICY "sightings_insert_auth" ON public.lost_pet_sightings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Alertas activas en un radio (vista para otros usuarios)
CREATE OR REPLACE FUNCTION public.nearby_lost_pets(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_radius_m INT DEFAULT 5000)
RETURNS TABLE (
  id UUID, pet_id UUID, pet_name TEXT, species pet_species, breed TEXT, photo_url TEXT, message TEXT,
  contact_phone TEXT, last_seen_at TIMESTAMPTZ, address TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION, distance_m DOUBLE PRECISION, reward NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.pet_id, p.name, p.species, p.breed, COALESCE(a.photo_url, p.photo_url), a.message, a.contact_phone,
         a.last_seen_at, a.address, a.lat, a.lng,
         ST_Distance(a.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_m, a.reward
    FROM public.lost_pet_alerts a JOIN public.pets p ON p.id = a.pet_id
   WHERE a.status = 'active' AND a.location IS NOT NULL
     AND ST_DWithin(a.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_m)
   ORDER BY distance_m;
$$;

-- Al crear una alerta: encolar push a usuarios con mascotas cerca (último radio conocido)
-- (la selección de destinatarios la hace la edge function lost-pet-broadcast; aquí solo se registra)
CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location geography(Point, 4326),
  city TEXT,
  neighborhood TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.sync_user_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_user_location ON public.user_locations;
CREATE TRIGGER trg_user_location BEFORE INSERT OR UPDATE ON public.user_locations
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_location();
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_locations_own" ON public.user_locations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Ficha pública de emergencia por token (QR en la placa) ----------------------
-- Reutiliza share_tokens: scope = 'emergency'
ALTER TABLE public.share_tokens ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'profile';

CREATE OR REPLACE FUNCTION public.pet_emergency_card(p_token TEXT)
RETURNS TABLE (
  pet_name TEXT, species pet_species, breed TEXT, sex TEXT, neutered BOOLEAN, birth_date DATE, weight NUMERIC,
  photo_url TEXT, microchip TEXT, allergies TEXT[], conditions TEXT[], blood_type TEXT,
  emergency_contact JSONB, owner_name TEXT, active_medications JSONB, last_vaccines JSONB, lost_alert JSONB
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.name, p.species, p.breed, p.sex, p.neutered, p.birth_date, p.weight, p.photo_url, p.microchip,
         p.allergies, p.conditions, p.blood_type, p.emergency_contact, u.display_name,
         (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', m.name, 'dose', m.dose_amount || ' ' || m.dose_unit, 'frequency', m.frequency_value || ' ' || m.frequency_unit)), '[]'::jsonb)
            FROM public.medications m WHERE m.pet_id = p.id AND m.active),
         (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', c.name, 'last', c.last_done_at, 'next', c.next_due_at) ORDER BY c.last_done_at DESC), '[]'::jsonb)
            FROM public.care_cycles c WHERE c.pet_id = p.id AND c.kind = 'vaccine' AND c.active),
         (SELECT to_jsonb(a) FROM public.lost_pet_alerts a WHERE a.pet_id = p.id AND a.status = 'active' ORDER BY a.created_at DESC LIMIT 1)
    FROM public.share_tokens t
    JOIN public.pets p ON p.id = t.pet_id
    JOIN public.users u ON u.id = p.user_id
   WHERE t.token = p_token AND (t.expires_at IS NULL OR t.expires_at > now());
$$;

-- Asistente -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  actions JSONB,                      -- acciones sugeridas: [{type:'remind'|'book'|'log', ...}]
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assistant_user_pet ON public.assistant_messages(user_id, pet_id, created_at);
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assistant_own" ON public.assistant_messages FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Etapas de vida: campos para celo / gestación
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS reproductive JSONB;   -- {last_heat_at, pregnant_since, due_at, litter_size}
