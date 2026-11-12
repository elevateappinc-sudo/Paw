# Deploy: main (DEV) → production (PROD)

Paw tiene **dos entornos**, cada uno atado a una rama y a un proyecto Supabase distinto.
El hosting es **Vercel** (dos deployments: uno por rama).

| Entorno | Rama | Supabase ref | Vercel |
|---|---|---|---|
| **DEV** | `main` | `qomzldpywoapcusavxqw` | deployment de `main` |
| **PROD** | `production` | `xqjecrcpkngguokbywex` | deployment de `production` |

> **Regla de oro:** `main=dev`, `production=prod`. Nunca push directo a ninguna de las dos
> (ver `commit-pr-rules.md`). La rama remota `dev` es legacy — ignorarla para deploys.

---

## Deploy a DEV (rutina normal)

1. Rama de trabajo → PR contra **`main`**.
2. Al mergear a `main`, Vercel despliega **DEV** solo (apunta a Supabase `qomzld…`).
3. Si el cambio incluye **migraciones** o **edge functions**, aplicarlas a **DEV primero**
   (ver `supabase-migrations.md` y `edge-functions.md`). **DEV antes que PROD, siempre.**

## Deploy a PROD (promoción)

PROD = promover lo que ya está probado en DEV. **Orden importa**: primero la BD/funciones,
luego el código.

### 1. Verificar que DEV está sano
Probar el cambio en el deployment de `main` (DEV) antes de promover.

### 2. Aplicar BD y funciones a PROD (si cambiaron)
Antes de mergear el código a `production`:

```bash
# Migraciones nuevas → aplicar a PROD (ref xqjecrcpkngguokbywex)
#   ver supabase-migrations.md para el método (CLI o admin API)
npx supabase link --project-ref xqjecrcpkngguokbywex
npx supabase db push

# Edge functions que cambiaron → desplegar a PROD
#   ver edge-functions.md
npx supabase functions deploy <funcion> --project-ref xqjecrcpkngguokbywex
```

> Si una migración borra/renombra columnas o toca datos, **tomar backup de PROD antes**
> y validar el diff. Nunca aplicar a PROD algo no probado en DEV.

### 3. Promover el código: PR `main` → `production`

```bash
git checkout production && git pull origin production
git checkout main && git pull origin main
# PR de promoción (firmado [NOMBRE], sin atribución a IA):
gh pr create --base production --head main \
  --title "[NOMBRE] chore(release): promover main → production" \
  --body "## Resumen
Promoción de los cambios validados en DEV.

## Incluye
- ...

## Checklist pre-prod
- [ ] Migraciones aplicadas a PROD (xqjec…)
- [ ] Edge functions desplegadas a PROD
- [ ] Probado en DEV
- [ ] Secrets/env de Vercel PROD al día

---

**Subido por:** NOMBRE"
```

- **No** mergear hasta que el usuario lo pida explícitamente (ver regla global: crear/pushear
  PRs sí; `gh pr merge` solo cuando el usuario lo pide).
- Al mergear a `production`, Vercel despliega **PROD** (apunta a Supabase `xqjec…`).

### 4. Validar PROD
- La app carga en el dominio de PROD, login OK, push OK, módulos clave OK.
- Revisar logs de Vercel y de las edge functions por errores.

---

## Variables de entorno (Vercel)

- Cada entorno tiene su propio set de env (Supabase url/keys, VAPID, OAuth, `NEXT_PUBLIC_URL`).
- **DEV** apunta a `qomzld…`; **PROD** a `xqjec…`. No mezclar.
- Local: `vercel env pull .env.local`.
- Secrets de servidor (`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, OAuth secret,
  `ANTHROPIC_API_KEY`) **solo** en scope de servidor, nunca `NEXT_PUBLIC_*`.

## Rollback
- **Código**: revertir el merge en `production` (Vercel redeploya el anterior) o "Promote to
  Production" de un deployment previo desde el dashboard de Vercel.
- **BD**: restaurar del backup previo (por eso se hace backup antes de migraciones destructivas).
