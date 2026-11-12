# Reglas de Commits y PRs (Paw)

> Paw es un **repo único**. Estas reglas viven acá (en Gym viven en Gym-Infra/.claude/shared;
> acá no hay orquestador). Ver `dev-identity.md` para el detalle de la identidad.

## Firma de identidad — OBLIGATORIA, sin excepción

La cuenta GitHub `elevateappinc-sudo` es **compartida** entre todos los devs. Sin firma
manual, el `git log` dice "elevateappinc-sudo" en todo y no se sabe quién hizo qué. Por eso
**todo commit y todo PR lleva el nombre del dev**.

### Antes del primer commit/PR de cada sesión
Preguntar el nombre del dev (si no se conoce ya en la sesión):
> "Antes de commitear, ¿cuál es tu nombre? Lo firmo en el commit y el PR para rastrear quién subió el cambio."

Reutilizar ese nombre en los commits/PRs siguientes de la misma sesión.

### Formato del título (commit + PR)
Prefijo `[NOMBRE]` en MAYÚSCULAS, **antes** del prefijo convencional:
```
[IRWIN] feat(pets): perfil ampliado con microchip
[MARIA] fix(auth): corrige redirect de OAuth en iOS PWA
```
- Nombre en mayúsculas para que destaque en `git log --oneline` y la lista de PRs.
- Una sola persona por título (quien hace el push final firma).

### Formato del cuerpo del commit
```
[NOMBRE] feat(scope): título corto

Detalle del cambio en uno o más párrafos.

Subido por: NOMBRE
```

### Formato del cuerpo del PR
La línea de autoría va al final, separada con `---`:
```markdown
## Resumen
...

## Test plan
- [ ] ...

---

**Subido por:** NOMBRE
```

## ⚠️ Atribución a IA — PROHIBIDA

**NO** incluir `Co-Authored-By: Claude`, `🤖 Generated with Claude Code`, ni ninguna
atribución a Claude/IA en commits, PRs, comentarios de código ni archivos del repo.
Los commits y PRs van **solo** a nombre del dev (`[NOMBRE]` + `Subido por:`).

## Flujo de ramas

**Nunca subir directo a `main` ni a `production`.** Todo cambio va en rama + PR.

```bash
# Antes de empezar
git checkout main && git pull origin main
git checkout -b claude/<feature>   # o fix/<...>, feat/<...>

# Antes de subir
git checkout main && git pull origin main
git checkout claude/<feature> && git merge main   # resolver conflictos
git push -u origin claude/<feature>
```

- **`main`** = entorno **DEV** (Supabase `qomzldpywoapcusavxqw`).
- **`production`** = entorno **PROD** (Supabase `xqjecrcpkngguokbywex`).
- El deploy a prod es un **PR de promoción `main` → `production`** (ver `deploy-main-production.md`).
- La rama remota `dev` es legacy/base de features — no es el entorno DEV.

## No tocar la identidad de git
`git config user.name` / `user.email` son globales y compartidos. **No modificarlos** en
commits — la firma va solo en el mensaje. Cambiarlos rompe el setup del equipo.
