# PWA y notificaciones push (Paw)

Paw es un **PWA instalable** con **Web Push**. En nativo (Capacitor) el push es otro canal
(ver `capacitor-build.md`).

## PWA (instalable)

- **Manifest:** `public/manifest.webmanifest` — `display: standalone`, `start_url: /home`,
  íconos (192/512/maskable + svg), `theme_color`/`background_color` `#F6F5FC`, shortcuts (SOS,
  Explorar). Al editar la marca/íconos, actualizar acá.
- **Instalación:** "Añadir a pantalla de inicio" (iOS Safari / Android Chrome). En standalone,
  recordar que iOS **no permite popups** → OAuth siempre por redirect (ver `architecture.md`).
- El manifest y `sw.js` son **rutas públicas** (ya en `publicRoutes` del middleware). Si cambian
  de ruta, mantenerlas públicas o fallan al cargar.

## Service worker (`public/sw.js`)

- Maneja **push** (`push` → `showNotification`) y **click** (`notificationclick` → abre la URL
  del payload). Íconos `/icon-192.png`.
- Payload esperado: `{ title, body, url }`. Si cambias el shape, actualiza `sw.js` **y** el
  emisor (edge functions / API).
- Es un SW mínimo (push), **no** cachea para offline. Si se quiere offline real, es trabajo
  aparte (precache/estrategias) — hoy no está.

## Web Push (VAPID)

- Claves **VAPID**: pública en `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (cliente), privada como **secret**
  de edge functions (`VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`).
  Generar: `npx web-push generate-vapid-keys`.
- Flujo: el cliente registra el SW y la suscripción push → se guarda en Supabase → las edge
  functions (`notification-processor` y las de recordatorios) envían la notificación.
- Los secrets son **por entorno** (DEV `qomzld…` / PROD `xqjec…`). Ver `edge-functions.md`.

## Caveat nativo (tiendas)

Web Push **no** cubre la app nativa. Al envolver con Capacitor hay que usar
`@capacitor/push-notifications` (APNs iOS / FCM Android), registrar el token del dispositivo y
que el backend sepa enviar a tokens nativos además de Web Push. Planear como trabajo de backend.
Ver `capacitor-build.md` §4.
