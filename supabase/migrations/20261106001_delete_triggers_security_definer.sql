-- Borrar un usuario desde Auth (dashboard o auth.admin.deleteUser) fallaba si
-- tenía registros de peso o reseñas: Auth borra con el rol
-- supabase_auth_admin, y la cascada dispara triggers que actualizan otras
-- tablas sin permiso para ese rol:
--   weight_logs → sync_pet_weight        (UPDATE public.pets)
--   reviews     → refresh_business_rating (UPDATE public.businesses)
-- Pasan a ejecutarse como su dueño (postgres).
--
-- search_path fijo: `public` porque el UPDATE de businesses dispara
-- sync_business_location, que usa PostGIS (instalado en public) sin calificar;
-- con un search_path vacío falla con "type geography does not exist".
-- `pg_temp` al final evita que una tabla temporal suplante a las reales.
-- Son funciones de trigger: no se pueden invocar fuera de un trigger.

ALTER FUNCTION public.sync_pet_weight() SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION public.refresh_business_rating() SECURITY DEFINER SET search_path = public, pg_temp;
