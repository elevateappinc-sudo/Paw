-- F1a-T02: Base schema — users, pets, auth_sync_errors
-- Sprint: paw-2026-W12

CREATE TYPE pet_species AS ENUM ('perro','gato','ave','conejo','otro');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  migration_completed BOOLEAN DEFAULT false,
  google_linked BOOLEAN DEFAULT false,
  google_id TEXT,
  google_linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species pet_species NOT NULL,
  breed TEXT,
  birth_date DATE,
  weight DECIMAL(5,2),
  emoji TEXT,
  color TEXT,
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.auth_sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
