-- Borrar un usuario fallaba por dos claves foráneas sin regla de borrado.
ALTER TABLE public.pet_members ALTER COLUMN invited_by DROP NOT NULL;
ALTER TABLE public.pet_members DROP CONSTRAINT IF EXISTS pet_members_invited_by_fkey;
ALTER TABLE public.pet_members ADD CONSTRAINT pet_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.itinerary_records DROP CONSTRAINT IF EXISTS itinerary_records_completado_por_fkey;
ALTER TABLE public.itinerary_records ADD CONSTRAINT itinerary_records_completado_por_fkey FOREIGN KEY (completado_por) REFERENCES public.users(id) ON DELETE SET NULL;
