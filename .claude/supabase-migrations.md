# Migraciones de BD (Paw)

En Paw la BD vive **en el repo**: `supabase/migrations/*.sql` (en Gym las migraciones viven
en Gym-Infra; acá no). Las migraciones son **secuenciales y numeradas por fecha**
(`YYYYMMDDNNN_descripcion.sql`) y se aplican **en orden**.

| Entorno | Supabase ref |
|---|---|
| DEV | `qomzldpywoapcusavxqw` |
| PROD | `xqjecrcpkngguokbywex` |

> **Regla de oro:** aplicar **siempre a DEV primero**, probar, y luego a PROD. Nunca a PROD
> algo no probado en DEV.

## Crear una migración

1. Nuevo archivo en `supabase/migrations/` con el siguiente número de fecha
   (ej. `20261106002_mi_cambio.sql`). No reusar números ni editar migraciones ya aplicadas.
2. SQL idempotente donde se pueda (`create ... if not exists`, `drop ... if exists`).
3. Si toca RLS, incluir las políticas en la misma migración.

## Aplicar — método recomendado (Supabase CLI)

```bash
# DEV
npx supabase link --project-ref qomzldpywoapcusavxqw
npx supabase db push

# PROD (después de validar en DEV)
npx supabase link --project-ref xqjecrcpkngguokbywex
npx supabase db push
```

Requiere `SUPABASE_ACCESS_TOKEN` (`sbp_...`) con alcance al proyecto, o `npx supabase login`.

## Aplicar — método alterno (admin API, por si falla el CLI)

`POST /v1/projects/{ref}/database/migrations` con el SQL. Nota operativa (de `docs/setup.md`):
numera por **segundo**, así que al aplicar varias en lote dejar **~1.5 s entre llamadas** para
no colisionar los números. Útil cuando no hay acceso de red directo a la BD.

## Antes de aplicar a PROD (migraciones destructivas)

Si la migración **borra/renombra columnas, borra datos o cambia constraints**:
1. **Backup de PROD** antes (dashboard → Database → Backups, o `pg_dump`).
2. Revisar el diff con cuidado.
3. Aplicar y **verificar** que los datos esperados siguen ahí (no asumir por "éxito" del push).

## SQL Editor (manual, último recurso)

Dashboard → SQL Editor → pegar cada archivo **en orden**. Solo para casos puntuales; el
método de referencia es el CLI para que el historial de migraciones quede consistente.

## Seed

`supabase/seed/` tiene datos de ejemplo (ej. `directory_bogota.sql`, negocios/eventos de
Bogotá). Ejecutar **después** de la migración que crea esas tablas (PostGIS/negocios).

## Estado / notas
- Orden correcto de las antiguas: `modules` antes que `f3_clinical_records` (ver `docs/setup.md`).
- Detalle de cada migración y del estado por entorno: `docs/setup.md`.
