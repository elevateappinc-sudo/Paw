-- Migration: Push nativo (FCM) para la app Capacitor (Android/iOS)
-- Hasta ahora push_subscriptions solo modelaba Web Push (endpoint/p256dh/auth).
-- La app nativa usa un token FCM distinto (no tiene endpoint/p256dh/auth), así que:
--   1) se añade la columna fcm_token
--   2) endpoint/p256dh/auth pasan a ser NULLABLE (un registro nativo no los trae)
--   3) un CHECK garantiza que cada fila tenga, o bien el trío Web Push, o bien un fcm_token

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Relajar los NOT NULL de Web Push (una suscripción nativa no los usa).
ALTER TABLE public.push_subscriptions ALTER COLUMN endpoint DROP NOT NULL;
ALTER TABLE public.push_subscriptions ALTER COLUMN p256dh   DROP NOT NULL;
ALTER TABLE public.push_subscriptions ALTER COLUMN auth     DROP NOT NULL;

-- Cada fila debe ser identificable: Web Push (endpoint) XOR nativo (fcm_token).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'push_subs_web_or_fcm'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subs_web_or_fcm
      CHECK (endpoint IS NOT NULL OR fcm_token IS NOT NULL);
  END IF;
END $$;

-- Un mismo device/token no debe duplicarse por usuario.
CREATE UNIQUE INDEX IF NOT EXISTS push_subs_user_fcm_uq
  ON public.push_subscriptions (user_id, fcm_token)
  WHERE fcm_token IS NOT NULL;

COMMENT ON COLUMN public.push_subscriptions.fcm_token IS
  'Token FCM del dispositivo nativo (Capacitor). NULL en suscripciones Web Push.';
