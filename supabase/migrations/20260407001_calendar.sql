-- PAW · Google Calendar Integration · Sprint 3
-- Migration: calendar_integrations + calendar_event_mappings + RLS + pgcrypto

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Helper RPCs for token encryption/decryption ────────────────────────────

-- encrypt_calendar_tokens: Called from Next.js callback to encrypt tokens before storage
CREATE OR REPLACE FUNCTION public.encrypt_calendar_tokens(
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'encrypted_access',  encode(pgp_sym_encrypt(p_access_token,  p_key)::bytea, 'base64'),
    'encrypted_refresh', encode(pgp_sym_encrypt(p_refresh_token, p_key)::bytea, 'base64')
  );
END;
$$;

-- decrypt_calendar_token: Used by Edge Functions to decrypt individual tokens
CREATE OR REPLACE FUNCTION public.decrypt_calendar_token(
  p_token TEXT,
  p_key TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(p_token, 'base64')::bytea, p_key);
EXCEPTION WHEN OTHERS THEN
  -- Return as-is if not encrypted (dev fallback)
  RETURN p_token;
END;
$$;

-- ─── Table: calendar_integrations ───────────────────────────────────────────
-- Stores per-user OAuth tokens (encrypted) and sync preferences
CREATE TABLE public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  gcal_calendar_id TEXT NOT NULL DEFAULT 'primary',
  webhook_channel_id TEXT,
  webhook_resource_id TEXT,
  webhook_expires_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  synced_event_types TEXT[] DEFAULT ARRAY['comida','salida','cita_vet','entrenamiento'],
  gcal_sync_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_own" ON public.calendar_integrations
  FOR ALL USING (user_id = auth.uid());

-- ─── Table: calendar_event_mappings ─────────────────────────────────────────
-- Maps PAW itinerary_events to Google Calendar event IDs
CREATE TABLE public.calendar_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  paw_event_id UUID NOT NULL,
  paw_event_type TEXT NOT NULL,
  gcal_event_id TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  gcal_deleted BOOLEAN DEFAULT false,
  UNIQUE(user_id, paw_event_id)
);

ALTER TABLE public.calendar_event_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mappings_own" ON public.calendar_event_mappings
  FOR ALL USING (user_id = auth.uid());

-- ─── Trigger: auto-update updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calendar_integrations_updated_at
  BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_calendar_updated_at();
