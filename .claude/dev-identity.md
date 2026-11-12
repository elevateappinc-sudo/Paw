# Identidad del desarrollador en commits y PRs (Paw)

Todos los devs comparten la cuenta de GitHub `elevateappinc-sudo`
(`elevateapp.inc@gmail.com`). Sin atribución explícita, el historial de git muestra siempre
el mismo autor y no se sabe quién subió qué cambio.

Para resolver eso se aplican **2 mecanismos en paralelo**:

1. **`git config user.name` local** — cada dev configura su nombre una vez en su máquina.
   Hace que `Author:` del `git log` muestre el nombre real.
2. **Firma explícita en el cuerpo del commit y PR** — cada commit/PR lleva `Subido por: <Nombre>`
   + el prefijo `[NOMBRE]` en el título. Sobrevive a casos donde el git config no esté bien
   y queda visible en revisiones de PR.

La 2 es **obligatoria** para todo commit/PR hecho desde Claude Code.

## 1) Configuración local — una vez por máquina

```bash
git config --global user.name "TuNombre"
git config --global user.email "elevateapp.inc@gmail.com"
```

Reemplaza `TuNombre` con tu nombre real (ej: `"Irwin"`). Después de esto, los commits a mano
quedan con `Author: TuNombre <elevateapp.inc@gmail.com>`.

## 2) Firma explícita en mensajes

Aplica a **todo commit/PR hecho desde Claude Code**, sin importar el estado del git config.

- **Título**: empieza con `[<NOMBRE>]` en MAYÚSCULAS, antes del prefijo convencional
  (`feat`, `fix`, `chore`, `docs`…). Una sola persona por título.
- **Cuerpo**: línea `Subido por: <NOMBRE>` como respaldo.
- **PR**: `**Subido por:** <NOMBRE>` al final, separado por `---`.

Ver `commit-pr-rules.md` para los formatos exactos.

## ⚠️ Atribución a IA — PROHIBIDA
No usar `Co-Authored-By: Claude`, `🤖`, ni similar. Los commits/PRs van solo a nombre del dev.

## Lo que NO se hace
- **NO** usar `--author` para fingir otro autor (la cuenta queda en `elevateappinc-sudo`).
- **NO** firmar con el nombre de otro dev sin que lo pida.
- **NO** omitir la firma en commits/PRs hechos por Claude.

## Por qué importa
Cuando algo se rompe en producción:
```bash
git log --oneline production | grep "tema-sospechoso"
gh pr view <pr> --json body | jq -r .body | grep "Subido por"
```
Identificas al responsable en 30 segundos.
