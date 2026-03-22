-- F1a-T03: Row Level Security policies
-- Sprint: paw-2026-W12

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
-- auth_sync_errors: no RLS (written by trigger with SECURITY DEFINER)

-- Users policies
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

-- Pets policies
CREATE POLICY "pets_select_own"
  ON public.pets FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() = ANY(shared_with));

CREATE POLICY "pets_insert_own"
  ON public.pets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pets_update_own"
  ON public.pets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "pets_delete_own"
  ON public.pets FOR DELETE
  USING (user_id = auth.uid());
