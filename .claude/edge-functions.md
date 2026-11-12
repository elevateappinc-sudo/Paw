# Edge Functions (Paw)

Las edge functions viven **en el repo**: `supabase/functions/*` (Deno). En Paw son la fuente
de verdad (en Gym viven en Gym-Infra; acá no).

| Entorno | Supabase ref |
|---|---|
| DEV | `qomzldpywoapcusavxqw` |
| PROD | `xqjecrcpkngguokbywex` |

## Funciones actuales

| Función | Qué hace |
|---|---|
| `care-cycle-reminders` | Cron diario 06:00 Bogotá (`Deno.cron`): recordatorios de ciclos de cuidado |
| `lost-pet-broadcast` | Invocada por el cliente al reportar mascota perdida (alerta a usuarios cercanos) |
| `notification-processor` | Procesa la cola de notificaciones → push |
| `generate-medication-logs` | Genera logs de medicación programada |
| `chronic-refill` | Recordatorios de recompra de crónicos |
| `autocomplete-missed` | Autocompleta tareas vencidas |
| `sync-to-gcal` / `sync-from-gcal` | Sincronización con Google Calendar |
| `renew-gcal-webhooks` | Renueva los webhooks de Google Calendar |

## Desplegar

```bash
# DEV primero
npx supabase functions deploy <funcion> --project-ref qomzldpywoapcusavxqw

# PROD (tras validar en DEV)
npx supabase functions deploy <funcion> --project-ref xqjecrcpkngguokbywex
```

Varias a la vez: repetir el comando por función (o `deploy` sin nombre para todas, con cuidado).

## Secrets requeridos (por proyecto)

`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, y las
claves de Google Calendar / IA según la función. Setear en **cada** entorno:

```bash
npx supabase secrets set VAPID_PRIVATE_KEY=... --project-ref <ref>
npx supabase secrets list --project-ref <ref>
```

> Los secrets de DEV y PROD son **distintos**. Un deploy a PROD sin sus secrets falla en runtime,
> no en el deploy — verificar `secrets list` del proyecto correcto.

## Reglas
- **DEV antes que PROD**, siempre.
- El deploy transpila/bundlea (cambios cosméticos en el código desplegado); verificar por
  **comportamiento/logs**, no por diff byte-a-byte contra el repo.
- Crons (`Deno.cron`) se registran al desplegar; confirmar en el dashboard que quedaron activos.
