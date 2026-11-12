"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";

/**
 * Registro de push NATIVO (Capacitor, Android/iOS) vía FCM.
 *
 * - Solo actúa en app nativa; en web/PWA es no-op (ahí manda usePushNotifications con Web Push/VAPID).
 * - Pide permiso, obtiene el token FCM del dispositivo y lo guarda en push_subscriptions
 *   (platform = android|ios, fcm_token). NO toca el flujo Web Push.
 * - Re-guarda el token si cambia (tokenReceived) y cuando hay sesión.
 *
 * Requisitos nativos (no en el repo): google-services.json (Android) / GoogleService-Info.plist (iOS)
 * del proyecto Firebase de Paw. Sin ellos el plugin no entrega token y el hook queda inerte sin romper.
 */
export function useNativePush(): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    let removeTokenListener: (() => void) | undefined;

    async function saveToken(token: string) {
      if (!token) return;
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const platform = Capacitor.getPlatform(); // 'android' | 'ios'
        await supabase.from("push_subscriptions").upsert(
          {
            user_id: user.id,
            fcm_token: token,
            platform: platform === "ios" ? "ios" : "android",
            active: true,
            last_used_at: new Date().toISOString(),
          },
          { onConflict: "user_id,fcm_token" }
        );
      } catch (err) {
        console.error("[NativePush] no se pudo guardar el token FCM:", err);
      }
    }

    (async () => {
      try {
        // Import dinámico: el plugin solo existe/carga en nativo.
        const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");

        const perm = await FirebaseMessaging.requestPermissions();
        if (perm.receive !== "granted") return;

        // Token actual.
        const { token } = await FirebaseMessaging.getToken();
        if (!disposed && token) await saveToken(token);

        // Token rotado por FCM.
        const handle = await FirebaseMessaging.addListener("tokenReceived", (event) => {
          if (!disposed && event?.token) void saveToken(event.token);
        });
        removeTokenListener = () => void handle.remove();
      } catch (err) {
        // Sin google-services.json / plist el plugin falla: no romper la app.
        console.warn("[NativePush] push nativo no disponible:", err);
      }
    })();

    return () => {
      disposed = true;
      removeTokenListener?.();
    };
  }, []);
}
