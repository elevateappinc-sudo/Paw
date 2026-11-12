"use client";

import { useNativePush } from "@/hooks/useNativePush";

/**
 * Inicializa el push nativo (FCM) al montar la app. Sin UI.
 * No-op en web/PWA; solo actúa dentro de la app Capacitor (Android/iOS).
 */
export function NativePushInit(): null {
  useNativePush();
  return null;
}
