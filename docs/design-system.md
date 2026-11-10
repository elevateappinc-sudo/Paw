# Design system · Azul sereno

Guía de producto, interfaz y desarrollo de Paw. Toda pantalla, componente o cambio de UI sigue este documento.

**Fuente de verdad de los valores:** `src/styles/tokens.css`. Este documento explica cómo y cuándo usarlos. Los pares de texto/fondo están validados con WCAG AA (4.5:1 en texto normal) en claro y oscuro; si se cambia un color, se vuelve a validar.

**Objetivo:** una interfaz casi monocromática en azul marino y celeste, limpia y tranquila, con tarjetas blancas sobre un fondo gris azulado; el color fuerte se reserva para lo urgente. Reemplaza a "Lavanda refinado" (nov 2026).

## 1. Principios de diseño

- **Minimalismo útil.** Una acción dominante por vista; texto breve y jerarquía clara. No esconder información necesaria para decidir.
- **Identidad animal.** Íconos, ilustraciones, avatares y loaders de mascotas. La iconografía genérica se reserva para navegación y utilidades.
- **Personalidad tranquila y monocromática.** Azul marino para la acción, celeste como acento y tintes azules para superficies destacadas; radios generosos y movimiento discreto. Un solo matiz de marca por pantalla.
- **Emergencia inequívoca.** El rojo se reserva para SOS, mascota perdida, urgencias y acciones destructivas confirmadas.
- **Datos sin duplicación.** Cada dato tiene una ubicación principal. Los resúmenes enlazan al detalle en lugar de repetirlo.
- **Accesible por defecto.** Contraste, foco, objetivos táctiles, etiquetas y movimiento reducido desde el inicio.
- **Claro y oscuro equivalentes.** Misma jerarquía y legibilidad; en claro las tarjetas llevan sombra suave, en oscuro se separan por capas.
- **Tokens como fuente de verdad.** Los componentes consumen tokens semánticos; nunca hexadecimales en JSX/TSX.

## 2. Color y temas

| Rol | Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- | --- |
| Fondo | `--color-bg` | #F2F5FA | #0B0D12 | Lienzo principal (gris azulado) |
| Superficie | `--color-surface` | #FFFFFF | #161920 | Tarjetas, filas, menús |
| Superficie elevada | `--color-surface-elevated` | #EBF0F8 | #1E222B | Sheets, popovers, campos |
| Borde | `--color-border` | #E1E7F0 | #2A2F3A | Divisores y contornos |
| Texto | `--color-text` | #0E1A33 | #F5F7FA | Texto principal |
| Texto secundario | `--color-text-secondary` | #55627C | #A9B0BF | Metadatos |
| Primario | `--color-primary` / `--color-on-primary` | #1B3266 / #FFF | #F5F7FA / #0B0D12 | CTA, FAB, pestaña activa, selección y foco |
| Primario suave | `--color-primary-soft` | #E5EEFB | #1C2740 | Fondos de ícono, contadores, chips, botón secondary |
| Texto primario | `--color-primary-text` | #2455B5 | #BCD3FF | Íconos, enlaces, nombre en el saludo, raza, fechas |
| Acento | `--color-accent` | #2B74C4 | #6FA8FF | Puntos indicadores, filtros seleccionados |
| Acento suave | `--color-accent-soft` | #E1EFFC | #1A2540 | Estados vacíos, fondos decorativos |
| Tintes (`pastel-lilac` / `mint` / `sky` / `peach`) | `--color-pastel-*` | #E4EBF8 / #E1EFF5 / #DDEBFB / #E8EDF5 | #1B2232 / #17252C / #192338 / #1F2230 | Variaciones de azul para superficies; nunca texto pequeño. Los nombres se conservan por compatibilidad |
| Tarjeta destacada | `--hero-from` / `--hero-to` / `--hero-glow` (clase `.hero-surface`) | #EEF5FE → #DCE9FB | #22304D → #161B27 + brillo azul | Solo la tarjeta de la mascota activa |
| Peligro | `--color-danger` | #D93645 | #FF7584 | Punto del SOS, llamada de urgencia, mascota perdida, destructivo |
| Éxito | `--color-success` | #217A55 | #71D5A7 | Completado, sin pendientes |
| Advertencia | `--color-warning` | #956000 | #F2C66D | Vence pronto |
| Información | `--color-info` | #2455B5 | #8DB8FF | Datos neutrales y avisos |

### 2.1 Reglas de aplicación

- CTA primario: azul marino con texto blanco (#1B3266 + blanco ≈ 12:1).
- **Monocromático:** íconos, fondos de ícono, servicios, tintes y anillos usan solo la familia azul. Lo pendiente o próximo va en `primary-text`; únicamente lo **vencido** (`overdue`) y lo urgente (`danger`) cambian de color. El verde (`success`) solo confirma una acción completada o "todo al día".
- El celeste de acento identifica (puntos, filtro activo); no dirige ni se usa para párrafos.
- Los estados combinan siempre color + ícono + texto.
- **Oscuro vivo:** grafito con un leve tinte frío y el blanco como color de acción (FAB, pestaña activa, botones). El azul de marca da vida en los detalles: íconos y fondos de ícono (`primary-text` celeste sobre `primary-soft` azul tenue), acento, anillos e información. Nunca superficies grandes azul marino.
- **Tarjetas invertidas (`.invert-dark`):** las que en claro son celestes (tarjeta de la mascota activa, tarjetas de "Para hoy", mosaicos de "Servicios y cuidados", mosaicos Sexo/Edad/Peso, portadas de "Cerca de ti", botón tonal "Reservar refuerzo") pasan a blancas en oscuro, con texto azul marino, íconos y acentos en el azul de marca, degradado blanco → celeste y un brillo azul debajo. La clase redefine los tokens solo dentro del elemento (definida en `tokens.css`), así el texto sigue siendo texto real y nítido; en claro no cambia nada.
- En claro las tarjetas blancas llevan `shadow-1`; en oscuro no hay sombras de tarjeta (solo el brillo azul de las invertidas) y los niveles se separan con `bg` → `surface` → `surface-elevated`.
- Colores de mascota (`--color-pet-*`): solo para datos personalizados (mapa, gráficos); la mascota se distingue por su foto, no por un fondo de color.

### 2.2 Severidad y estados

| Estado | Tokens | Ícono | Regla |
| --- | --- | --- | --- |
| Vencido | `--color-overdue-soft` / `-text` | alert-circle | Fecha pasada; priorizar |
| Vence pronto | `--color-primary-soft` / `--color-primary-text` | clock | 7 días o menos (sin color de alerta) |
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

- Sentence case en etiquetas y botones ("Añadir mascota"). Mayúsculas solo en "SOS" y en la etiqueta superior `.eyebrow` (11 px, 600, espaciado 0.08 em, texto secundario), p. ej. "MASCOTA ACTIVA", el día y mes del mosaico de fecha.
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

- Tarjetas estándar: blancas, borde de 1 px y sombra suave `shadow-1` (`Card` tono surface). Filas de tarea, mosaicos de servicio, evento y botones de flecha siguen la misma regla.
- Elementos flotantes (menú, FAB, sheet, popover, toasts): `--shadow-nav` / `shadow-2` / `shadow-3`, sombras azuladas. Máximo tres niveles.
- Tarjeta destacada: `.hero-surface` (degradado celeste, borde de luz y resplandor); una sola por pantalla.
- En oscuro, sin sombras de tarjeta; el menú conserva una sombra oscura para flotar.
- La tarjeta destacada admite chips translúcidos (`--color-pastel-glass`), con contraste propio.
- No mezclar borde fuerte, sombra, color saturado y gran radio en el mismo componente.

## 6. Componentes base (`src/components/ui`)

| Componente | Variantes / medidas | Reglas |
| --- | --- | --- |
| `Button` | primary, secondary (relleno suave), outline (borde), ghost, destructive; S 36, M 44, L 52 | Un CTA primario por vista. Press `scale(0.98)` en 120 ms. Loading conserva ancho y bloquea doble envío |
| `IconButton` | 44 × 44, ícono 20–24 px | `label` obligatorio (nombre accesible) |
| `Chip` (filtro) | 36 px; activo celeste + check | Los filtros no son estados |
| `StatusChip` / `Tag` | soft + text + ícono, 12 px | Solo informa |
| `TabBar` | Barra blanca sólida, 72 px + safe area, radio 24, `--shadow-nav`; 4 destinos con el "+" al centro | Activo: bloque azul marino (radio 16) que se desliza, con ícono y etiqueta blancos; inactivo: trazo y texto secundario. Rebote breve al activar (sin él con movimiento reducido) |
| FAB central | 64 px circular, azul marino, elevado sobre la barra con anillo de 4 px del color de fondo | "Registrar" (o "Añadir mascota" si no hay); siempre en el centro del menú |
| `SOSButton` | Píldora invertida (fondo `text`, texto `bg`) con punto `danger` que late, mayúsculas | Solo en contexto de emergencia (Salud, mascota perdida, error). Las acciones que llaman o comparten datos se confirman antes |
| Encabezado de sección | Título 20 px + contador opcional (píldora `primary-soft`) + botón de flecha blanco de 44 px | Flecha en vez de "Ver todo" |
| Selectores (`DateField`, `TimeField`, `OptionSelect`, `Calendar`, `Popover`) | Campo igual a `Input` (50 px; `compact` 44 px sobre `bg`) que abre un `Popover`: superficie, borde, radio 24, `shadow-3`, por encima de los sheets | Nunca controles nativos (`<select>`, `type="date"`/`"time"`): `Input type="date|time"` y `Select` ya usan estos. Calendario lunes a domingo (L M X J V S D), día elegido en círculo primario, hoy en `primary-text` con punto, días fuera de rango atenuados; el título "Noviembre 2026" abre años y meses; pie con "Borrar" y "Hoy". Opciones con check en la elegida. Teclado: flechas, Enter y Escape |
| `Sheet` | Superficie elevada, radio superior 24 px, manija 32 × 4 | Cierre por botón y gesto |
| `SegmentedControl` | ≥ 40 px | Salud, Rutina, Historial |
| `EmptyState` | Ícono animal + título + una línea + CTA | Una acción que resuelva |
| Tarjeta de mascota (Inicio) | `.hero-surface`: foto cuadrada 76 px con borde blanco, nombre + chip de sexo, raza en azul, edad, anillo "x/y al día" (cifra 14 px, total y "al día" 11 px regular); franja inferior con vacunas y peso | Encima, `.eyebrow` "Mascota activa" con avatares apilados para cambiar de mascota y "+" |
| `PetTag` (ficha médica) | Filas etiqueta-valor | Solo datos existentes; alergias y condiciones primero |
| Fila de tarea | Tarjeta blanca independiente (radio 24, `shadow-1`), ícono 48 px en cuadro `primary-soft` con borde, título, línea "• detalle · fecha" y check circular fino | Nunca como tabla con divisores. Urgente primero; animación breve con alternativa accesible |
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

Solo `transform` y `opacity`. Skeleton con un barrido sincronizado y fundido cruzado al contenido. Con `prefers-reduced-motion`: sin barrido, giro 3D ni rebote.

## 9. Patrones de pantalla

| Pantalla | Estructura | Reglas |
| --- | --- | --- |
| Inicio | Cabecera mínima sobre el fondo: ícono de la app (`AppMark`, huella en cuadro primario + "Paw") a la izquierda y foto de perfil a la derecha; sin saludo, franja ni SOS · mascota activa · para hoy · servicios y cuidados · cerca de ti (la recomendada primero, con marca) · próximo evento | Una CTA primaria; los módulos vacíos se ocultan; nada se repite entre módulos |
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
- [ ] ¿El oscuro conserva jerarquía sin sombras de tarjeta?
- [ ] ¿La pantalla usa un solo matiz de marca (azul) y el color fuerte solo para lo vencido o urgente?
- [ ] ¿Objetivos táctiles y foco visibles?
- [ ] ¿Loading, vacío, error, offline y éxito?
- [ ] ¿Respeta movimiento reducido?
- [ ] ¿Sin hexadecimales ni estilos ad hoc?
- [ ] ¿Lo médico o de emergencia sigue legible y prioritario?
