"use client";

import { useEffect } from "react";

/**
 * Maneja los App Links / deep links en la app nativa (Capacitor).
 *
 * Flujo OAuth nativo: el login abre el navegador del sistema; al terminar, Google redirige a
 * https://<dominio>/auth/callback?code=... El App Link (assetlinks.json + intent-filter) hace
 * que esa URL abra la APP en vez del navegador, disparando 'appUrlOpen'. Aquí:
 *   1) cerramos el navegador del sistema (si quedó abierto),
 *   2) navegamos el WebView a la ruta del callback para que haga el exchange (server-side,
 *      con las cookies del WebView del dominio) y deje la sesión lista.
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

          // Cerrar el navegador del sistema que abrió el login.
          try {
            const { Browser } = await import("@capacitor/browser");
            await Browser.close();
          } catch { /* puede no estar abierto */ }

          // Llevar el WebView al callback (con code/query) para completar el exchange.
          window.location.href = url.pathname + url.search;
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
