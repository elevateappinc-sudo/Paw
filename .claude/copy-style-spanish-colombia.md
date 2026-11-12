# Copy en español de Colombia (tuteo)

Todo el texto en español que se genere o modifique en este repo debe estar en **español de Colombia (tuteo)**, no en voseo argentino. Esto aplica a:

- Copy de UI (componentes React, toasts, mensajes de error, copys de wizards, etc.)
- Documentación (`.md` en raíz, `.claude/`, `docs/`)
- Mensajes de commit y descripciones de PR
- Respuestas en chat de Claude Code

## Reglas de reemplazo (referencia rápida)

| ❌ Voseo | ✅ Tuteo (Colombia) |
|---|---|
| Activá las notificaciones | Activa las notificaciones |
| Andá a Perfil | Ve a Perfil |
| Haz click en | Haz click en (igual, ya está OK) |
| Hacé click en | Haz click en |
| Tenés que | Tienes que |
| Querés | Quieres |
| Decime | Dime |
| Avisame | Avísame |
| Mandame | Mándame |
| Confirmá | Confirma |
| Pasame | Pásame |
| Probá | Prueba |
| Mirá | Mira |
| Sos / sés | Eres |
| Acordate | Acuérdate |
| Olvidate | Olvídate |
| Recordate | Recuérdate |

## Vocabulario y giros

- Sin coletillas argentinas: "che", "boludo", "loco", "ojo", "bueno".
- "ahora mismo" / "ya" en lugar de "ya mismo" / "ahora nomás".
- "computador" o "PC" en lugar de "compu" / "computadora".
- "rato" / "momento" en lugar de "ratito".
- "carpeta" en lugar de "carpetilla".
- "Listo" como confirmación ("Listo, eso es todo") es OK en Colombia.

## Cómo aplicar

- **Código nuevo**: generar copy en tuteo desde el primer momento.
- **Código existente**: si toco un archivo por otra razón y veo voseo, lo corrijo en el mismo PR (cleanup incremental).
- **Barrido completo**: solo si el usuario lo pide explícitamente (puede ser PR aparte para no mezclar con feature work).
- **Respuestas al usuario en chat**: también en tuteo de Colombia, salvo que el usuario use voseo (entonces no cambiarle el registro).

## Excepción

Si el usuario me pide explícitamente usar voseo o ñ-neutro para un copy específico, respetar la solicitud puntual sin extender al resto del repo.
