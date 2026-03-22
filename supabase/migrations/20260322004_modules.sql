-- F1b: Módulos de datos — expenses, training, vaccines, itinerary, notifications
-- Sprint: paw-2026-W12

-- ─────────────────────────────────────────
-- ENUMs
-- ─────────────────────────────────────────
CREATE TYPE training_tipo AS ENUM ('fisico','mental','comportamental');
CREATE TYPE training_modalidad AS ENUM ('clase','practica');
CREATE TYPE training_task_estado AS ENUM ('pendiente','en_progreso','completado');
CREATE TYPE itinerary_tipo AS ENUM ('comida','salida');
CREATE TYPE notification_tipo AS ENUM ('nota','alerta','logro');

-- ─────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATE NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  quien_pago TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo_ejercicio training_tipo NOT NULL,
  modalidad training_modalidad DEFAULT 'clase',
  fecha DATE NOT NULL,
  entrenador TEXT,
  temas TEXT,
  ejercicios TEXT,
  avances TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.training_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  estado training_task_estado DEFAULT 'pendiente'
);

CREATE TABLE public.vaccines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  fecha_aplicacion DATE NOT NULL,
  proxima_fecha DATE,
  veterinario TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.itinerary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo itinerary_tipo NOT NULL,
  nombre TEXT NOT NULL,
  hora TIME NOT NULL,
  dias INT[] NOT NULL,
  cantidad TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.itinerary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.itinerary(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  completado BOOLEAN DEFAULT false,
  completado_por UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  tipo notification_tipo NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT,
  leida BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_expenses_pet_fecha ON public.expenses(pet_id, fecha DESC);
CREATE INDEX idx_training_sessions_pet_fecha ON public.training_sessions(pet_id, fecha DESC);
CREATE INDEX idx_vaccines_pet_proxima ON public.vaccines(pet_id, proxima_fecha);
CREATE INDEX idx_itinerary_pet ON public.itinerary(pet_id);
CREATE INDEX idx_itinerary_records_item_fecha ON public.itinerary_records(item_id, fecha);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, leida, created_at DESC);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- expenses
CREATE POLICY "expenses_owner" ON public.expenses
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- training_sessions
CREATE POLICY "training_sessions_owner" ON public.training_sessions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- training_tasks (via join to training_sessions)
CREATE POLICY "training_tasks_owner" ON public.training_tasks
  USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = training_tasks.session_id
        AND ts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = training_tasks.session_id
        AND ts.user_id = auth.uid()
    )
  );

-- vaccines
CREATE POLICY "vaccines_owner" ON public.vaccines
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- itinerary
CREATE POLICY "itinerary_owner" ON public.itinerary
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- itinerary_records (via pet ownership)
CREATE POLICY "itinerary_records_owner" ON public.itinerary_records
  USING (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = itinerary_records.pet_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = itinerary_records.pet_id
        AND p.user_id = auth.uid()
    )
  );

-- notifications
CREATE POLICY "notifications_owner" ON public.notifications
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
