# PAW — Setup

## Requisitos

- Node.js 20+ (probado con 24)
- Proyecto Supabase **PAW - Dev** `qomzldpywoapcusavxqw` (región ca-central-1). El proyecto anterior `rgcpbuhypcvttqanvnpq` queda como respaldo; sus valores están comentados en `.env.local`.

## Variables de entorno (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # solo servidor
SUPABASE_ACCESS_TOKEN=sbp_...        # token con alcance al proyecto, para migraciones y funciones
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...     # push; la privada es secret de edge functions
NEXT_PUBLIC_URL=https://tu-dominio
ANTHROPIC_API_KEY=...                # asistente (/asistente); sin ella responde "no configurado"
```

En local: `vercel env pull .env.local`.

## Base de datos

Las migraciones viven en `supabase/migrations/`. Las de la reestructuración (octubre 2026) son:

| Archivo | Qué hace |
| --- | --- |
| `20261007001_pets_profile_v2.sql` | Perfil ampliado (sexo, microchip, alergias, contacto…) y `weight_logs` |
| `20261007002_care_cycles.sql` | Motor de ciclos: `care_protocols`, `care_cycles`, `care_cycle_logs`, RPC `complete_care_cycle`, semilla de protocolos |
| `20261007003_rls_pet_access.sql` | `can_access_pet()` y políticas por miembro de la mascota; elimina `pets.shared_with` |
| `20261007004_vaccines_to_cycles.sql` | Backfill de vacunas antiguas y ciclos de catálogo para mascotas existentes |
| `20261007005_postgis_businesses.sql` | PostGIS, negocios geolocalizados, servicios, reseñas, reservas, eventos, RPC `nearby_businesses` |
| `20261007006_lost_pets_emergency_assistant.sql` | Mascota perdida, ficha pública de emergencia, asistente |
| `20261007007_users_within_radius.sql` | Destinatarios de alertas de mascota perdida |

Aplicarlas en orden. Opciones:

1. **Supabase CLI** (recomendado): `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`.
2. **SQL Editor** del dashboard: pegar cada archivo en orden.

Semilla del directorio (negocios y eventos ficticios para Bogotá): `supabase/seed/directory_bogota.sql`. Ejecutar después de la migración 005.

> Estado al 9 oct 2026: las 22 migraciones (incluidas `20261008001` storage, `002` política de pets y `003` claves foráneas) están aplicadas en PAW - Dev por la API de administración (`POST /v1/projects/{ref}/database/migrations`, con 1,5 s entre llamadas porque numera por segundo). Orden correcto de las antiguas: `modules` antes que `f3_clinical_records`.

## Edge functions

```bash
npx supabase functions deploy care-cycle-reminders   # cron diario 06:00 Bogotá (Deno.cron)
npx supabase functions deploy lost-pet-broadcast     # invocada por el cliente al reportar mascota perdida
```

Las existentes (`notification-processor`, `generate-medication-logs`, `chronic-refill`, `autocomplete-missed`, `sync-*-gcal`, `renew-gcal-webhooks`) no cambian.

Secrets necesarios en el proyecto: `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`.

## Google OAuth

Igual que antes: proveedor Google en Authentication → Providers, redirect `https://<ref>.supabase.co/auth/v1/callback`, Site URL y Redirect URLs con `/auth/callback`. Ver `docs/ios-pwa-oauth-spike.md`.

## Mapas

Explorar usa MapLibre con los estilos gratuitos de CARTO (`basemaps.cartocdn.com`). Para producción con tráfico alto, cambiar a un proveedor con clave (MapTiler, Stadia) en `src/components/explorar/MapView.tsx`.

## Modo demo (sin Supabase)

Para ver la app con datos e imágenes de ejemplo sin aplicar migraciones:

- En el login, pulsa **Ver la demo con datos de ejemplo**, o abre `/demo`. Se guarda la cookie `paw_demo=1` (30 días). `/demo?off=1` la quita; cerrar sesión también.
- Para forzarlo en un despliegue: `NEXT_PUBLIC_PAW_DEMO=1`.
- Los datos viven en `src/lib/demo/data.ts` (usuaria Andrea con Luna, Milo y Coco; 15 negocios en Bogotá; citas, eventos, una mascota perdida, ficha pública en `/e/demo-luna`). Las mutaciones se guardan en `localStorage` durante el día y se reinician al día siguiente.
- El cliente simulado (`src/lib/demo/client.ts`) cubre select/insert/update/upsert/delete con filtros y embeds, los RPC de las migraciones, auth, storage y functions. Las imágenes vienen de loremflickr y pravatar con semilla fija.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3004
npx tsc --noEmit
npm run lint
npx jest
```

Contexto para implementar módulos nuevos: `docs/build-context.md`.
