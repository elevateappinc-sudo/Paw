"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Maneja los App Links / deep links en la app nativa (Capacitor).
 *
 * Flujo OAuth nativo: el login abre el navegador del sistema; al terminar, Google redirige a
 * https://<dominio>/auth/callback?code=... El App Link (assetlinks.json + intent-filter) hace
 * que esa URL abra la APP en vez del navegador, disparando 'appUrlOpen'. Aquí:
 *   1) cerramos el navegador del sistema (si quedó abierto),
 *   2) hacemos el exchange del `code` por sesión EN EL CLIENTE del WebView.
 *
 * Por qué en el cliente y no navegando al callback server-side: el `code_verifier` de PKCE lo
 * generó signInWithOAuth en este WebView (su storage), así que el exchange debe correr en la
 * MISMA instancia del cliente para tener el verifier. Navegar al route.ts server-side dependía
 * de cookies que no siempre llegan → la sesión no se creaba y el usuario quedaba en /login.
 *
 * No-op en web/PWA (ahí el redirect normal del navegador ya hace todo).
 */
export function DeepLinkHandler(): null {
  useEffect(() => {
    let removeListener: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("appUrlOpen", async (event) => {
        try {
          const url = new URL(event.url);
          // Solo nos interesa el callback de OAuth.
          if (!url.pathname.startsWith("/auth/callback")) return;

          const code = url.searchParams.get("code");
          const errorDescription = url.searchParams.get("error_description");

          // Cerrar el navegador del sistema que abrió el login.
          try {
            const { Browser } = await import("@capacitor/browser");
            await Browser.close();
          } catch { /* puede no estar abierto */ }

          if (errorDescription || !code) {
            console.error("[DeepLink] OAuth sin code:", errorDescription);
            return;
          }

          // Exchange en el cliente: usa el code_verifier guardado en este WebView.
          const supabase = createClient();
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[DeepLink] exchangeCodeForSession falló:", error.message);
            return;
          }

          // Sesión lista: recargar en la home para que la app tome la sesión.
          window.location.href = "/";
        } catch (err) {
          console.error("[DeepLink] no se pudo procesar el enlace:", err);
        }
      });
      removeListener = () => void handle.remove();
    })();

    return () => removeListener?.();
  }, []);

  return null;
}
