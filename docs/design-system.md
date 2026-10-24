# Design system · Lavanda refinado

Guía de producto, interfaz y desarrollo de Paw. Toda pantalla, componente o cambio de UI sigue este documento.

**Fuente de verdad de los valores:** `src/styles/tokens.css`. Este documento explica cómo y cuándo usarlos. Los pares de texto/fondo están validados con WCAG AA (4.5:1 en texto normal) en claro y oscuro; si se cambia un color, se vuelve a validar.

**Objetivo:** conservar la personalidad lavanda/rosa de Paw y elevar su claridad, consistencia, accesibilidad y preparación para producción.

## 1. Principios de diseño

- **Minimalismo útil.** Una acción dominante por vista; texto breve y jerarquía clara. No esconder información necesaria para decidir.
- **Identidad animal.** Íconos, ilustraciones, avatares y loaders de mascotas. La iconografía genérica se reserva para navegación y utilidades.
- **Personalidad tranquila.** Lavanda como base, rosa como acento; superficies suaves, radios generosos y movimiento discreto.
- **Emergencia inequívoca.** El rojo se reserva para SOS, mascota perdida, urgencias y acciones destructivas confirmadas.
- **Datos sin duplicación.** Cada dato tiene una ubicación principal. Los resúmenes enlazan al detalle en lugar de repetirlo.
- **Accesible por defecto.** Contraste, foco, objetivos táctiles, etiquetas y movimiento reducido desde el inicio.
- **Claro y oscuro equivalentes.** Misma jerarquía y legibilidad; el oscuro usa capas, no sombras.
- **Tokens como fuente de verdad.** Los componentes consumen tokens semánticos; nunca hexadecimales en JSX/TSX.

## 2. Color y temas

| Rol | Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- | --- |
| Fondo | `--color-bg` | #F7F6FC | #0D0C1B | Lienzo principal |
| Superficie | `--color-surface` | #FFFFFF | #17162B | Tarjetas, filas, menús |
| Superficie elevada | `--color-surface-elevated` | #F0EFFA | #211F3A | Sheets, popovers, campos |
| Borde | `--color-border` | #E3E1F2 | #302E4A | Divisores y contornos |
| Texto | `--color-text` | #19182B | #F4F2FF | Texto principal |
| Texto secundario | `--color-text-secondary` | #575971 | #B0AEC9 | Metadatos (ajustado de #5E6078 para cumplir AA sobre pastel lila) |
| Primario | `--color-primary` / `--color-on-primary` | #625FE8 / #FFF | #A5A2FF / #0D0C1B | CTA, FAB, selección y foco |
| Primario suave | `--color-primary-soft` | #E9E8FF | #29264D | Fondos de ícono, selección tenue, botón secondary |
| Texto primario | `--color-primary-text` | #514CCB | #C0BDFF | Texto e íconos sobre fondos suaves |
| Acento | `--color-accent` | #F28CCB | #F5A2D7 | Filtros seleccionados, anillos, detalles |
| Acento suave | `--color-accent-soft` | #FCE8F4 | #43243A | Estados vacíos, fondos decorativos |
| Pastel lila / menta / cielo / durazno | `--color-pastel-*` | #DDD8FC / #D6F1E2 / #D8EAFE / #FFE4D5 | #302C59 / #1D3A30 / #1D344B / #472F2B | Superficies; nunca texto pequeño |
| Peligro | `--color-danger` | #D93645 | #FF7584 | SOS, mascota perdida, destructivo |
| Éxito | `--color-success` | #217A55 | #71D5A7 | Completado, sin pendientes |
| Advertencia | `--color-warning` | #956000 | #F2C66D | Vence pronto |
| Información | `--color-info` | #3564B8 | #8CB6FF | Datos neutrales y avisos |

### 2.1 Reglas de aplicación

- CTA primario con texto blanco solo si cumple AA para su tamaño y peso (#625FE8 + blanco = 4.86:1). Si no, `--color-primary-text` sobre fondo suave.
- El rosa no se usa para párrafos ni como sustituto del primario: identifica, no dirige.
- Los estados combinan siempre color + ícono + texto.
- En oscuro no hay sombras: los niveles se separan con `bg` → `surface` → `surface-elevated`.
- Colores de mascota (personalización): lavanda, rosa, menta, cielo, durazno y ciruela (`--color-pet-*`), mezclados al 18–22 % con la superficie. Siempre con un indicador adicional (nombre o borde).

### 2.2 Severidad y estados

| Estado | Tokens | Ícono | Regla |
| --- | --- | --- | --- |
| Vencido | `--color-overdue-soft` / `-text` | alert-circle | Fecha pasada; priorizar |
| Vence pronto | `--color-warning-soft` / `-text` | clock | 7 días o menos |
| Al día | `--color-success-soft` / `-text` | check-circle | Sin pendientes |
| Informativo | `--color-info-soft` / `-text` | info | Dato neutral |
| Destructivo | `--color-danger-soft` / `-text` | alert-triangle | Confirmar antes de eliminar o cerrar |

## 3. Tipografía

Plus Jakarta Sans, Regular (400) y Semibold (600). La jerarquía se construye con tamaño y espaciado, no con negritas.

| Token | Clase | Tamaño / peso | Interlineado | Uso |
| --- | --- | --- | --- | --- |
| `--text-display` | `text-display` | 26 px / 600 | 1.15 | Título de pantalla o cifra destacada |
| `--text-title` | `text-title` | 20 px / 600 | 1.2 | Título de sección y saludo |
| `--text-subtitle` | `text-subtitle` | 16 px / 600 | 1.3 | Nombre de mascota, tarjeta, tarea |
| `--text-body` | `text-body` | 14 px / 400 | 1.45 | Contenido general y botones |
| `--text-secondary` | `text-small` | 12 px / 400 | 1.4 | Metadatos y descripciones |
| `--text-label` | `text-label` | 11 px / 600 | 1.3 | Etiquetas cortas no esenciales; nunca información crítica |
| `--text-input` | `text-input` | 16 px / 400 | 1.4 | Campos de entrada (evita zoom en iOS) |

- Sentence case en etiquetas y botones ("Añadir mascota"); solo "SOS" va en mayúsculas.
- No truncar edad, dosis, alergias ni información médica: permitir wrap.
- Nada funcional por debajo de 12 px (estados, fechas, errores, pistas, enlaces).
- Números tabulares (`tabular-nums`; automático en `dd`, `td`, `time`) para peso, fechas, gasto y progreso.

## 4. Espaciado, radios y layout

| Token | Valor | Uso |
| --- | --- | --- |
| `--space-1` … `--space-8` | 4 · 8 · 12 · 16 · 20 · 24 · 32 px | Ícono-texto · chips · filas · tarjeta y margen lateral · bloques compactos (excepción documentada) · secciones · inicio de pantalla |
| `--radius-sm` / `md` / `lg` / `xl` / `full` | 8 · 12 · 16 · 24 · 999 px | Miniaturas · campos y tarjetas pequeñas · tarjetas y mosaicos · destacadas, sheets, perfiles · píldoras y avatares |
| `--touch-target` | 44 × 44 px | Objetivo táctil mínimo |
| `--nav-height` | 72 px + safe area | Barra inferior |
| `--content-bottom-padding` | ≈ 96 px | Contenido nunca debajo del menú o del FAB (`pb-content`) |
| `--app-max-width` | 640 px | Ancho máximo centrado |

Múltiplos de 4 px; las excepciones (20 px) van por token y documentadas.

## 5. Elevación, bordes y superficies

- Tarjetas estándar: borde de 1 px, sin sombra (`Card` tiene `elevation = 0` por defecto).
- Sombras lavanda sutiles solo en elementos flotantes: menú, sheet, popover, FAB, toasts y controles sobre mapa o foto. Máximo tres niveles. El menú y el FAB usan `--shadow-nav` (sombra + brillo superior `--nav-highlight`).
- En oscuro, sin sombras.
- Tarjetas pastel admiten una tarjeta interior translúcida (`--color-pastel-glass`), con contraste propio.
- No mezclar borde fuerte, sombra, color saturado y gran radio en el mismo componente.

## 6. Componentes base (`src/components/ui`)

| Componente | Variantes / medidas | Reglas |
| --- | --- | --- |
| `Button` | primary, secondary (relleno suave), outline (borde), ghost, destructive; S 36, M 44, L 52 | Un CTA primario por vista. Press `scale(0.98)` en 120 ms. Loading conserva ancho y bloquea doble envío |
| `IconButton` | 44 × 44, ícono 20–24 px | `label` obligatorio (nombre accesible) |
| `Chip` (filtro) | 36 px; activo rosa + check | Los filtros no son estados |
| `StatusChip` / `Tag` | soft + text + ícono, 12 px | Solo informa |
| `TabBar` | 4 destinos, 72 px + safe area; vidrio con `--shadow-nav` + `--nav-highlight` (sin sombra en oscuro) | Activo: píldora primaria deslizante, ícono relleno y etiqueta semibold; inactivo: trazo y regular. Rebote breve al activar (sin él con movimiento reducido) |
| FAB | 52 px circular | Una acción contextual; nunca tapa contenido |
| `SOSButton` | Píldora roja de alto contraste | Solo en contexto de emergencia (Inicio, Salud, mascota perdida, error). Las acciones que llaman o comparten datos se confirman antes |
| `Sheet` | Superficie elevada, radio superior 24 px, manija 32 × 4 | Cierre por botón y gesto |
| `SegmentedControl` | ≥ 40 px | Salud, Rutina, Historial |
| `EmptyState` | Ícono animal + título + una línea + CTA | Una acción que resuelva |
| Tarjeta de mascota | Foto/avatar, nombre, raza/edad, próximo cuidado y progreso | Color solo como matiz; máximo dos métricas secundarias |
| `PetTag` (ficha médica) | Filas etiqueta-valor | Solo datos existentes; alergias y condiciones primero |
| Fila de tarea | Ícono 32–40 px, título, fecha, completar | Urgente primero; animación breve con alternativa accesible |
| Skeleton | Geometría real; avatar con silueta animal | No mostrar si la espera es < 300 ms |
| Toast | Mensaje corto + acción opcional | Nunca para información crítica |

Estados de todos los componentes: default, pressed, focused, disabled, loading, selected y error, sin depender solo del color.

## 7. Iconografía y avatares

Set propio en `src/components/icons/pet.ts` (grilla 24 × 24, trazo ≈ 2 px, extremos redondeados): `PetEar`, `PetNails`, `PetDental`, `PetBath`, `PetGrooming`, `PetFlea`, `PetDeworm`, `PetVaccine`, `PetMedication`, `PetHealth`, `PetWeight`, `PetFood`, `PetWalk`, `PetDaycare`, `PetTraining`, `PetShop`, `PetEmergency`. Los íconos de interfaz (buscar, flecha, calendario, teléfono, mapa) son de Lucide. Sin emoji en producción.

Avatares: primero la foto del usuario; si no hay, retrato realista por especie y raza (`src/lib/petPortrait.ts`, fotos en `public/avatars/real/`) para perro, gato, conejo, ave y "otro". Nunca una persona.

## 8. Movimiento, skeletons y loaders

| Token | Valor | Uso |
| --- | --- | --- |
| `--duration-fast` / `base` / `slow` | 120 / 200 / 320 ms | Feedback · entrada y estados · sheets y modales |
| `--stagger-step` | 40 ms | Escalonado, máximo 6–8 elementos |
| `--ease-standard` | cubic-bezier(0.2, 0, 0, 1) | General |
| `--ease-enter` | cubic-bezier(0.16, 1, 0.3, 1) | Entrada de contenido |
| `--ease-playful` | cubic-bezier(0.2, 0.8, 0.2, 1) | Check de tarea, microanimación |
| `--loader-delay` | 300 ms | Umbral para mostrar loader o skeleton |

Loaders (`src/components/ui/Loaders.tsx`): `PawLoader` (espera sin forma), `PawDotsLoader` (dentro de botón), `PetSilhouetteLoader` (primera carga larga), `SpotsLoader` (bienvenida, decorativo), `TailRefresh` (pull-to-refresh), `LostPetRadar` (solo mascota perdida, con texto de estado).

Solo `transform` y `opacity`. Skeleton con un barrido sincronizado y fundido cruzado al contenido. Con `prefers-reduced-motion`: sin barrido, giro 3D ni rebote. El carrusel 3D del Inicio rota como máximo 32°.

## 9. Patrones de pantalla

| Pantalla | Estructura | Reglas |
| --- | --- | --- |
| Inicio | Saludo, carrusel de mascotas, para hoy, servicios, recomendado, cerca de ti, evento | Una CTA primaria; los módulos vacíos se ocultan |
| Mascotas | Selector, foto, nombre y raza, mosaicos sexo/edad/peso, personas con acceso, Salud / Rutina / Historial | Datos básicos con una sola ubicación |
| Salud | Historial médico, ficha médica, gráfico de peso con resumen textual | Ordenar por urgencia; fecha, unidad y contexto |
| Rutina | Cuadrícula de alimentación, higiene, itinerario, entrenamiento | Iconografía propia |
| Historial | Actividad cronológica agrupada por mes; gasto del mes | Sin duplicar datos del perfil |
| SOS | Cerrar, urgencia, mascota, llamada principal, compartir/perdida, ficha, contactos | Llamar y compartir se confirman diciendo qué pasará |
| Explorar | Búsqueda, categorías, filtros con contador, mapa, resultados | Estados de ubicación y error accesibles |
| Mascota perdida | Banner persistente, tiempo transcurrido, difusión, contacto, radar | El rojo domina el flujo |

Estados obligatorios: cargando (skeleton), vacío con acción, error con "Reintentar", sin conexión, éxito y permisos denegados (explicar y ofrecer alternativa).

## 10. Accesibilidad

- Objetivo táctil de 44 × 44 px; foco visible de 2 px en primario.
- WCAG AA: 4.5:1 texto normal, 3:1 texto grande y gráficos.
- Íconos decorativos con `aria-hidden`; controles con nombre accesible.
- Loaders con `role="status"`, `aria-live="polite"` y etiqueta.
- Formularios con label persistente y errores asociados al campo.
- `prefers-reduced-motion` y `prefers-reduced-transparency` respetados.
- Gráficos con etiquetas, unidades y resumen textual.

## 11. Implementación

| Archivo | Responsabilidad |
| --- | --- |
| `src/styles/tokens.css` | Temas, colores, tipografía, espacio, radios, sombras, movimiento |
| `src/app/globals.css` | Tokens → utilidades de Tailwind; clases de interacción, skeleton y loaders |
| `src/components/ui/` | Componentes base; las pantallas no los reestilizan |
| `src/components/icons/pet.ts` | Íconos de mascota |
| `src/lib/petPortrait.ts` | Avatar por especie y raza |
| `CLAUDE.md` | Obliga a seguir este sistema |

- Ningún hexadecimal en componentes: crear el token (claro y oscuro) y documentarlo aquí.
- Sin valores arbitrarios de Tailwind para color, radio o espaciado si existe token.
- Probar en ancho móvil, con texto largo, datos vacíos, mala conexión, teclado y lector de pantalla.

## 12. Checklist antes de entregar

- [ ] ¿Una sola acción primaria clara?
- [ ] ¿Se entiende en segundos, sin texto redundante?
- [ ] ¿Íconos, avatares y loaders de mascotas?
- [ ] ¿Contraste AA y estados con texto/ícono además de color?
- [ ] ¿El oscuro conserva jerarquía sin sombras?
- [ ] ¿Objetivos táctiles y foco visibles?
- [ ] ¿Loading, vacío, error, offline y éxito?
- [ ] ¿Respeta movimiento reducido?
- [ ] ¿Sin hexadecimales ni estilos ad hoc?
- [ ] ¿Lo médico o de emergencia sigue legible y prioritario?
