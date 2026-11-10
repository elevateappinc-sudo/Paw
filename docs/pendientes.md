# Funciones apagadas para el lanzamiento

Se apagan en `src/lib/features.ts`. Con `false` no aparecen en la app y sus rutas responden 404. Para retomarlas, completar lo de cada sección y poner `true`.

## Google Calendar (`FEATURES.googleCalendar`)

Apagado el 10 nov 2026. La conexión de la cuenta funciona, pero no sincroniza nada.

**Qué hay**
- Botón en Ajustes → Integraciones (`src/components/settings/SettingsView.tsx`, `src/app/settings/integrations/page.tsx`, `src/components/settings/CalendarIntegration.tsx`).
- OAuth propio: `src/app/auth/google-calendar/route.ts` (permiso `calendar.events`) y `callback/route.ts`, que guarda los tokens cifrados con las RPC `encrypt_calendar_tokens` / `decrypt_calendar_token` (pgcrypto; ya existen en Dev y Prod).
- Cliente de la API en `src/lib/google-calendar.ts` (crear, editar, borrar, listar y observar eventos). Hoy no se usa en ningún lado.
- Edge functions `sync-to-gcal`, `sync-from-gcal` y `renew-gcal-webhooks`, desplegadas en Dev y Prod. Nada las llama.

**Qué falta**
1. Sincronizar Paw → Google: llamar a `sync-to-gcal` (o a `createEvent`/`updateEvent`/`deleteEvent`) cuando se crea, cambia o completa una cita o un ciclo de cuidado. Decidir qué se sincroniza (citas, ciclos, comidas) y el enlace de vuelta (`sync-to-gcal` usa `/itinerario?event=`, que ya no es la ruta correcta).
2. Google → Paw: crear la ruta `src/app/api/gcal/webhook/route.ts` que recibe los avisos de Google y llama a `sync-from-gcal`. Hoy `renew-gcal-webhooks` apunta a esa ruta y no existe.
3. Programar `sync-from-gcal` (cada 15 min) y `renew-gcal-webhooks` (cada 6 días) con `pg_cron`, igual que los recordatorios.
4. Verificación de Google: `calendar.events` es un permiso sensible. Sin verificar, cada usuario ve "Google no verificó esta app" y hay un límite de 100 usuarios. Pide video de demostración, política de privacidad que mencione el uso del calendario, y revisión (días o semanas).
5. Credenciales (las tres iguales en ambos lados):
   - Vercel (Production y Preview): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_ENCRYPTION_KEY` (`openssl rand -hex 32`).
   - Supabase → Edge Functions → Secrets (Dev y Prod): las mismas tres, más `NEXT_PUBLIC_URL`.
   - Google Cloud → cliente OAuth → URIs de redireccionamiento: `https://paw.elevateapp.co/auth/google-calendar/callback`, `https://paw-git-main-elevateappinc-8599s-projects.vercel.app/auth/google-calendar/callback` y `http://localhost:3004/auth/google-calendar/callback`. Habilitar la Google Calendar API en el proyecto.
6. Poner `googleCalendar: true` y probar conectar, crear una cita y verla en Google Calendar.

## Asistente con IA (`FEATURES.assistant`)

Apagado el 10 nov 2026. Funciona, pero falta la llave y no tiene un acceso visible desde el rediseño.

**Qué hay**
- Pantalla `/asistente` (`src/components/asistente/`), ruta `/api/assistant` con el SDK de Anthropic e historial en `assistant_messages`.

**Qué falta**
1. `ANTHROPIC_API_KEY` en Vercel (Production y Preview). Revisar que el modelo configurado en `src/app/api/assistant/route.ts` sea uno vigente.
2. Definir dónde se entra (por ejemplo, desde el perfil de la mascota) siguiendo `docs/design-system.md`.
3. Poner `assistant: true` y probar en claro y oscuro.
