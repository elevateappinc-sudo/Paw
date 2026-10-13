-- Fase 3 · destinatarios de alertas de mascota perdida (usado por lost-pet-broadcast)
CREATE OR REPLACE FUNCTION public.users_within_radius(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_radius_m INT DEFAULT 3000, p_limit INT DEFAULT 500)
RETURNS TABLE (user_id UUID, distance_m DOUBLE PRECISION)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ul.user_id, ST_Distance(ul.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_m
    FROM public.user_locations ul
   WHERE ul.location IS NOT NULL
     AND ST_DWithin(ul.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_m)
     AND ul.updated_at > now() - interval '60 days'
   ORDER BY distance_m
   LIMIT p_limit;
$$;
-- Solo la service role (edge function) debe llamarla
REVOKE EXECUTE ON FUNCTION public.users_within_radius(DOUBLE PRECISION, DOUBLE PRECISION, INT, INT) FROM anon, authenticated;
