-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 2 · Directorio geolocalizado de negocios
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- Negocios: pueden existir sin dueño (carga manual del directorio) y reclamarse
ALTER TABLE public.businesses ALTER COLUMN owner_user_id DROP NOT NULL;
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_type_check;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_type_check CHECK (type IN (
  'veterinaria','urgencias','peluqueria','tienda','farmacia','entrenador','paseador','guarderia','pet_friendly','funeraria','otro'
));
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS hours JSONB,                -- {"mon":[["08:00","20:00"]], ... , "emergency_24h": true}
  ADD COLUMN IF NOT EXISTS emergency_24h BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_level SMALLINT CHECK (price_level BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS price_from NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS claimed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS writes_history BOOLEAN NOT NULL DEFAULT false,  -- registra en el historial de la mascota
  ADD COLUMN IF NOT EXISTS promo_text TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- mantener location a partir de lat/lng
CREATE OR REPLACE FUNCTION public.sync_business_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  IF NEW.categories = '{}' AND NEW.type IS NOT NULL THEN NEW.categories := ARRAY[NEW.type]; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_business_location ON public.businesses;
CREATE TRIGGER trg_business_location BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.sync_business_location();

CREATE INDEX IF NOT EXISTS idx_businesses_location ON public.businesses USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_businesses_categories ON public.businesses USING GIN (categories);

-- Servicios ofrecidos ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2),
  duration_min INT,
  care_cycle_kind care_cycle_kind,          -- qué ciclo completa (bath, vaccine…)
  care_cycle_name TEXT,                     -- nombre concreto (ej. "Antirrábica")
  active BOOLEAN NOT NULL DEFAULT true,
  sort INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_business_services_business ON public.business_services(business_id) WHERE active;

-- Reseñas ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (business_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON public.reviews(business_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.refresh_business_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_id UUID := COALESCE(NEW.business_id, OLD.business_id);
BEGIN
  UPDATE public.businesses b
     SET rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews r WHERE r.business_id = v_id), 0),
         rating_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.business_id = v_id)
   WHERE b.id = v_id;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_refresh_rating ON public.reviews;
CREATE TRIGGER trg_refresh_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_business_rating();

-- Reservas --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.business_services(id) ON DELETE SET NULL,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','confirmed','completed','cancelled','no_show')),
  price NUMERIC(12,2),
  notes TEXT,
  business_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_business ON public.bookings(business_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_pet ON public.bookings(pet_id, starts_at DESC);

ALTER TABLE public.care_cycle_logs
  DROP CONSTRAINT IF EXISTS care_cycle_logs_booking_id_fkey,
  ADD CONSTRAINT care_cycle_logs_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Al completar una reserva: ciclo en el historial + gasto
CREATE OR REPLACE FUNCTION public.on_booking_completed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_srv RECORD; v_cycle UUID; v_biz RECORD;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at := now();
    SELECT * INTO v_srv FROM public.business_services WHERE id = NEW.service_id;
    SELECT * INTO v_biz FROM public.businesses WHERE id = NEW.business_id;

    IF v_srv.care_cycle_kind IS NOT NULL THEN
      SELECT id INTO v_cycle FROM public.care_cycles
       WHERE pet_id = NEW.pet_id AND kind = v_srv.care_cycle_kind AND active
         AND (v_srv.care_cycle_name IS NULL OR lower(name) = lower(v_srv.care_cycle_name))
       ORDER BY next_due_at LIMIT 1;
      IF v_cycle IS NULL THEN
        INSERT INTO public.care_cycles (pet_id, user_id, kind, name, interval_days, next_due_at, source)
        VALUES (NEW.pet_id, NEW.user_id, v_srv.care_cycle_kind, COALESCE(v_srv.care_cycle_name, v_srv.name),
                CASE v_srv.care_cycle_kind WHEN 'vaccine' THEN 365 WHEN 'bath' THEN 21 WHEN 'nails' THEN 21 WHEN 'grooming' THEN 56 WHEN 'deworm_internal' THEN 90 WHEN 'deworm_external' THEN 30 ELSE 90 END,
                CURRENT_DATE, 'business')
        RETURNING id INTO v_cycle;
      END IF;
      INSERT INTO public.care_cycle_logs (cycle_id, pet_id, user_id, done_at, cost, business_id, booking_id, notes)
      VALUES (v_cycle, NEW.pet_id, NEW.user_id, (NEW.starts_at AT TIME ZONE 'America/Bogota')::date, NEW.price, NEW.business_id, NEW.id, v_biz.name || ' · ' || v_srv.name);
    END IF;

    IF NEW.price IS NOT NULL AND NEW.price > 0 THEN
      INSERT INTO public.expenses (pet_id, user_id, monto, fecha, categoria, descripcion, quien_pago)
      VALUES (NEW.pet_id, NEW.user_id, NEW.price, (NEW.starts_at AT TIME ZONE 'America/Bogota')::date,
              CASE WHEN v_srv.care_cycle_kind IN ('bath','grooming','nails') THEN 'Baño' WHEN v_srv.care_cycle_kind IS NOT NULL THEN 'Salud' ELSE 'Otros' END,
              v_biz.name || ' · ' || COALESCE(v_srv.name, 'servicio'), 'Yo');
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_booking_completed ON public.bookings;
CREATE TRIGGER trg_booking_completed BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.on_booking_completed();

-- Eventos ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  organizer_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('adopcion','clase','carrera','feria','salud','social','otro')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  address TEXT,
  city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location geography(Point, 4326),
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  capacity INT,
  cover_url TEXT,
  species pet_species[] DEFAULT '{perro,gato}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.sync_event_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_event_location ON public.events;
CREATE TRIGGER trg_event_location BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.sync_event_location();
CREATE INDEX IF NOT EXISTS idx_events_starts ON public.events(starts_at) WHERE active;
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events USING GIST (location);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going','interested','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Guardados -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_businesses (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, business_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "businesses_own" ON public.businesses;
CREATE POLICY "businesses_select_auth" ON public.businesses FOR SELECT USING (active AND auth.uid() IS NOT NULL);
CREATE POLICY "businesses_insert_own" ON public.businesses FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "businesses_update_own" ON public.businesses FOR UPDATE USING (owner_user_id = auth.uid());
CREATE POLICY "businesses_delete_own" ON public.businesses FOR DELETE USING (owner_user_id = auth.uid());

ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_select_auth" ON public.business_services FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "services_manage_owner" ON public.business_services FOR ALL
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_user_id = auth.uid()));

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select_auth" ON public.reviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_user_id = auth.uid()));
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE USING (user_id = auth.uid());

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_select" ON public.bookings FOR SELECT
  USING (user_id = auth.uid() OR public.can_access_pet(pet_id) OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_user_id = auth.uid()));
CREATE POLICY "bookings_insert" ON public.bookings FOR INSERT WITH CHECK (user_id = auth.uid() AND public.can_access_pet(pet_id));
CREATE POLICY "bookings_update" ON public.bookings FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_user_id = auth.uid()));

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_auth" ON public.events FOR SELECT USING (active AND auth.uid() IS NOT NULL);
CREATE POLICY "events_manage_own" ON public.events FOR ALL USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvps_select_auth" ON public.event_rsvps FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rsvps_manage_own" ON public.event_rsvps FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.saved_businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_own" ON public.saved_businesses FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ¿Está abierto ahora? (hora de Bogotá)
CREATE OR REPLACE FUNCTION public.business_is_open(p_hours JSONB, p_emergency BOOLEAN DEFAULT false)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_now TIMESTAMP := (now() AT TIME ZONE 'America/Bogota');
  v_key TEXT := (ARRAY['sun','mon','tue','wed','thu','fri','sat'])[EXTRACT(DOW FROM v_now)::int + 1];
  v_time TEXT := to_char(v_now, 'HH24:MI');
  v_slot JSONB;
BEGIN
  IF p_emergency THEN RETURN true; END IF;
  IF p_hours IS NULL OR p_hours->v_key IS NULL THEN RETURN false; END IF;
  FOR v_slot IN SELECT * FROM jsonb_array_elements(p_hours->v_key) LOOP
    IF v_time >= (v_slot->>0) AND v_time <= (v_slot->>1) THEN RETURN true; END IF;
  END LOOP;
  RETURN false;
END $$;

-- ─── RPC: negocios cercanos ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.nearby_businesses(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_m INT DEFAULT 2000,
  p_categories TEXT[] DEFAULT NULL,
  p_open_now BOOLEAN DEFAULT false,
  p_min_rating NUMERIC DEFAULT NULL,
  p_limit INT DEFAULT 50
) RETURNS TABLE (
  id UUID, name TEXT, type TEXT, categories TEXT[], description TEXT, address TEXT, neighborhood TEXT, city TEXT,
  lat DOUBLE PRECISION, lng DOUBLE PRECISION, distance_m DOUBLE PRECISION,
  rating_avg NUMERIC, rating_count INT, price_from NUMERIC, price_level SMALLINT,
  verified BOOLEAN, emergency_24h BOOLEAN, writes_history BOOLEAN, cover_url TEXT, logo_url TEXT,
  hours JSONB, promo_text TEXT, whatsapp TEXT, phone TEXT, is_open BOOLEAN
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT b.*, ST_Distance(b.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_m
      FROM public.businesses b
     WHERE b.active AND b.location IS NOT NULL
       AND ST_DWithin(b.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_m)
       AND (p_categories IS NULL OR b.categories && p_categories)
       AND (p_min_rating IS NULL OR b.rating_avg >= p_min_rating)
  ), withopen AS (
    SELECT base.*, public.business_is_open(base.hours, base.emergency_24h) AS is_open FROM base
  )
  SELECT id, name, type, categories, description, address, neighborhood, city, lat, lng, distance_m,
         rating_avg, rating_count, price_from, price_level, verified, emergency_24h, writes_history, cover_url, logo_url,
         hours, promo_text, whatsapp, phone, is_open
    FROM withopen
   WHERE (NOT p_open_now OR is_open)
   ORDER BY distance_m
   LIMIT p_limit;
$$;

-- Urgencia más cercana (para la hoja SOS) ------------------------------------
CREATE OR REPLACE FUNCTION public.nearest_emergency(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_limit INT DEFAULT 3)
RETURNS SETOF public.businesses LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.* FROM public.businesses b
   WHERE b.active AND b.location IS NOT NULL AND (b.emergency_24h OR 'urgencias' = ANY(b.categories))
   ORDER BY b.location <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
   LIMIT p_limit;
$$;

-- ─── Analítica endurecida ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "analytics_insert_all" ON public.listing_analytics;
CREATE OR REPLACE FUNCTION public.track_listing_event(p_listing_id UUID, p_event TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  -- máximo 1 evento por usuario, listado y tipo cada hora
  IF EXISTS (
    SELECT 1 FROM public.listing_analytics a
     WHERE a.listing_id = p_listing_id AND a.event_type = p_event AND a.user_id = auth.uid()
       AND a.created_at > now() - interval '1 hour'
  ) THEN RETURN; END IF;
  INSERT INTO public.listing_analytics (listing_id, event_type, user_id) VALUES (p_listing_id, p_event, auth.uid());
EXCEPTION WHEN undefined_column THEN
  INSERT INTO public.listing_analytics (listing_id, event_type) VALUES (p_listing_id, p_event);
END $$;
