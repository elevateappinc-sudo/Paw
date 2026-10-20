# Design system · Paleta Lavanda

Especificación de diseño de la app de mascotas (cuidado, lugares, comunidad de mascotas perdidas y fundaciones). Toda pantalla o componente nuevo, o cualquier cambio de UI, debe seguir este documento.

**Fuente de verdad de los valores:** `tokens.css`. Este documento explica cómo y cuándo usarlos.

## Reglas obligatorias

1. **Nunca usar colores hex directos en componentes.** Usar siempre las variables de `tokens.css` (`var(--color-primary)`, etc.). Si falta un token, se agrega a `tokens.css` en vez de inventarlo en el componente.
2. **Modo claro y oscuro desde el inicio.** Cada componente debe verse bien en ambos. Revisar los dos antes de dar por terminado un cambio.
3. **Solo dos pesos tipográficos:** regular (400) y semibold (600). La jerarquía se marca con el tamaño, no poniendo todo en negrita.
4. **Espaciado solo en múltiplos de 4 px** (`--space-*`). Nada de 10, 14 o 18 px.
5. **Un solo botón primario por vista.**
6. **El rojo (`--color-danger`) es exclusivo de SOS y mascota perdida.** Las tareas vencidas usan `--color-overdue` (frambuesa lavanda), no rojo.
7. **El rosa (`--color-accent`) es acento de marca**, no un estado: filtro activo, anillo del avatar de mascota, íconos de estados vacíos y detalles puntuales.
8. **Área táctil mínima de 44 px** en todo elemento interactivo.
9. **El contenido con scroll nunca queda debajo del menú flotante.** Aplicar `padding-bottom: var(--content-bottom-padding)` a los contenedores con scroll.
10. **Respetar `prefers-reduced-motion`** en toda animación (ver la sección Movimiento).

## Color

| Rol | Token | Uso |
| --- | --- | --- |
| Fondo | `--color-bg` | Fondo de pantalla |
| Superficie | `--color-surface` | Tarjetas, filas, menú |
| Superficie elevada | `--color-surface-elevated` | Hojas inferiores, popovers |
| Borde | `--color-border` | Bordes de 1 px de tarjetas y chips |
| Texto | `--color-text` / `--color-text-secondary` | Principal / metadatos |
| Primario | `--color-primary` + `--color-on-primary` | Botón principal, FAB, banner promocional |
| Primario suave | `--color-primary-soft` + `--color-primary-text` | Fondo de íconos de categoría, pestaña activa del menú, chip informativo |
| Acento | `--color-accent` + `--color-on-accent` | Filtro seleccionado, anillo del avatar |
| Vencido | `--color-overdue-*` | Tareas y cuidados con fecha pasada |
| Vence pronto | `--color-warning-*` | Tareas de los próximos 7 días |
| Al día | `--color-success-*` | Vacunas, antipulgas y demás cuidados al día |
| Peligro | `--color-danger-*` | Botón SOS, modo mascota perdida, acciones destructivas |

En modo oscuro la elevación se marca con capas de superficie (`bg` → `surface` → `surface-elevated`), no con sombras.

**Contraste:** `--color-primary` con texto blanco en modo claro da unos 4:1. Úsalo en botones con texto de 14 px semibold o más. Para texto pequeño sobre fondos de color, usa los pares `*-soft` + `*-text`.

## Escala de severidad

Cada estado usa siempre el mismo color, el mismo ícono y el mismo texto, en chips, tareas y notificaciones.

| Estado | Fondo + texto | Ícono sugerido | Regla |
| --- | --- | --- | --- |
| Vencido | `overdue-soft` + `overdue-text` | alerta circular | Fecha ya pasada |
| Vence pronto | `warning-soft` + `warning-text` | reloj | Vence en 7 días o menos |
| Al día | `success-soft` + `success-text` | check | Sin pendientes |
| Informativo | `info-soft` + `info-text` | info | Datos neutros |

En las tarjetas de mascota se muestra primero lo urgente. Los estados al día se agrupan en un solo chip ("2 al día").

## Tipografía

Una familia sans geométrica (`--font-sans`). Escala reducida el 15 oct 2026 a pedido del equipo (antes 28/22/17/15/13/12).

| Token | Tamaño | Peso | Uso |
| --- | --- | --- | --- |
| `--text-display` | 24 | semibold | Título de pantalla ("Mis mascotas") |
| `--text-title` | 19 | semibold | Título de sección ("Hoy le toca a Jagger") |
| `--text-subtitle` | 16 | semibold | Nombre en tarjeta, título de tarea |
| `--text-body` | 14 | regular | Texto general |
| `--text-secondary` | 12 | regular | Metadatos (raza, edad, distancia) |
| `--text-label` | 11 | semibold | Chips, links, etiquetas del menú |

Todos los títulos de pantalla usan el mismo estilo de encabezado. Nunca se muestran como botón o píldora con borde.

## Espaciado y radios

- Espaciado: `--space-1` (4), `--space-2` (8), `--space-3` (12), `--space-4` (16, margen lateral), `--space-6` (24, entre secciones), `--space-8` (32).
- Radios: `--radius-sm` (8) para íconos y miniaturas, `--radius-md` (12) para tarjetas, `--radius-lg` (16) para banners y fotos, `--radius-xl` (24) para hojas inferiores, `--radius-full` para botones, chips y menú.

## Componentes

**Botones:** primario, secundario (borde), fantasma y destructivo, en tamaños S (32), M (44) y L (52). Siempre en forma de píldora. Estados: reposo, hover, presionado (escala 0.97 en `--duration-fast`), cargando y deshabilitado. Al cargar, el texto se reemplaza por el loader de huellitas sin cambiar el ancho del botón.

**Chips:** hay dos tipos y nunca se mezclan.
- Filtro: seleccionable. Inactivo con superficie y borde; activo con `--color-accent` y `--color-on-accent` más un check.
- Estado: solo informativo, con los pares de la escala de severidad.

Las filas de chips con scroll horizontal muestran un desvanecido en el borde para indicar que hay más.

**Tarjeta de mascota:** foto con `--radius-md`, nombre, "Especie · Raza · edad legible" (por ejemplo "1 año y 8 meses", nunca truncado a "20 mes…"), chips de estado (lo urgente primero) y próxima tarea.

**Fila de tarea:** ícono en un recuadro de 32 px, título, fecha relativa con el color de su estado y un check circular a la derecha. Deslizar para marcar como hecha.

**Menú inferior flotante:** barra blanca redondeada (`--radius-xl`) con 4 destinos (Inicio, Mascotas, Explorar, Citas). El activo lleva su ícono dentro de un cuadrado `--color-primary` con `--color-on-primary` y la etiqueta en `--color-primary-text`.

**FAB contextual:** botón circular de 52 px con `--color-primary`. Su acción cambia según la pantalla: Registrar en Inicio, Añadir en Mascotas y Reportar en Comunidad. En Explorar no hay FAB, porque la búsqueda ya está en pantalla.

**Botón SOS:** siempre visible arriba a la derecha, con `--color-danger` sólido, `--color-on-danger` y el texto "SOS" en mayúsculas. Es el elemento de mayor contraste de la pantalla.

**Hoja inferior (Explorar):** `--color-surface-elevated`, `--radius-xl` arriba, manija de 32×4 px. Sus elementos no se superponen entre sí ni quedan bajo el menú.

**Tarjetas pastel:** las piezas destacadas del inicio usan fondos pastel con texto `--color-text`: la tarjeta de la mascota toma su propio color (`color-mix` del color de la mascota con la superficie) y la recomendación usa `--color-pastel-lilac`. Las tarjetas internas sobre pastel usan `--color-pastel-glass`. Máximo dos tarjetas pastel por pantalla para no invadir.

**Estado vacío:** ícono en un círculo con `--color-accent` suave, título, una línea de explicación, una acción principal que resuelva el problema (por ejemplo "Ampliar a 5 km") y una secundaria opcional ("Avisarme").

**Mapa:** estilo de mapa personalizado con tonos de la paleta (fondo `--color-bg`, calles en `--color-map-road`, agua en `--color-map-water`; ambos tokens dan más contraste que `--color-border` y `--color-primary-soft`). Marcadores por categoría con el color del módulo.

## Estados obligatorios por pantalla

Toda pantalla que carga datos implementa: **cargando** (skeleton), **vacío** con acción, **error** con reintento, **sin conexión** y **éxito**.

## Movimiento

### Principios

- Todas las duraciones y curvas salen de `tokens.css` (`--duration-*`, `--ease-*`).
- El movimiento comunica estado. Nada se anima solo para decorar, salvo los loaders temáticos.
- Solo se animan `transform` y `opacity`, para mantener 60 fps. Nunca se anima `width`, `height`, `top` ni `left`.
- Con `prefers-reduced-motion: reduce` se cambian los movimientos por fundidos simples o estados estáticos (ver abajo).

### Transiciones generales

| Caso | Animación | Duración / curva |
| --- | --- | --- |
| Aparición de contenido | Opacidad 0→1 + `translateY(8px → 0)` | `--duration-base` · `--ease-enter` |
| Listas | Igual que la aparición, escalonada `--stagger-step` por elemento (máximo 8 escalonados) | |
| Presionar botón o tarjeta | `scale(0.97)` | `--duration-fast` · `--ease-standard` |
| Hoja inferior y modales | `translateY(100% → 0)` | `--duration-slow` · `--ease-enter` |
| Cambio de pestaña | Fundido cruzado | `--duration-base` |
| Marcar tarea como hecha | El check se dibuja (stroke-dashoffset), la fila se desvanece y colapsa | `--duration-slow` · `--ease-playful` en el check |

### Skeleton

- Se usa siempre que se conoce la forma del contenido: tarjetas de mascota, filas de tareas, lista de lugares, perfiles.
- Las formas replican el layout real, con el mismo radio, alto y espaciado que el componente final. Los avatares de mascota en skeleton tienen forma de **gota u óvalo de cabeza con dos orejitas redondeadas** en lugar de un círculo plano.
- **Barrido (shimmer):** un degradado diagonal de `--skeleton-base` a `--skeleton-highlight` y de vuelta a `--skeleton-base`, que recorre de izquierda a derecha en `--duration-shimmer` con `ease-in-out`, en bucle infinito. Todos los bloques de una pantalla comparten el mismo barrido sincronizado (`background-attachment: fixed` o un único overlay), para que se vea como una sola ola y no como bloques descoordinados.
- **Transición skeleton → contenido:** fundido cruzado. El skeleton baja a opacidad 0 mientras el contenido aparece con opacidad 0→1 y `translateY(4px → 0)` en `--duration-base`, escalonado por elemento con `--stagger-step`. Nunca se hace un cambio brusco.
- Si la carga termina en menos de `--loader-delay` (300 ms), el skeleton no se muestra.
- **Movimiento reducido:** sin barrido. Pulso de opacidad 0.6 ↔ 1 cada 1,6 s, o skeleton estático.

### Loaders temáticos

Los loaders se hacen con **SVG inline + animaciones CSS** (o Lottie si el equipo ya lo usa), en colores de la paleta (`--color-primary`, `--color-accent`, `--color-primary-soft`). Deben ser ligeros: menos de 10 KB por loader y sin imágenes rasterizadas.

| Loader | Descripción | Dónde se usa |
| --- | --- | --- |
| **Huellitas caminando** | 4 huellas aparecen una tras otra en diagonal (izquierda, derecha, izquierda, derecha), como un perro caminando. Cada una entra con escala 0.6→1 y opacidad 0→1 y se desvanece al llegar la siguiente. Ciclo de `--duration-loader`. | Loader general por defecto: cargas medianas y pantallas sin layout conocido |
| **Almohadillas que rebotan** | Los 3 dedos de una huella rebotan en secuencia (efecto de 3 puntos), con la almohadilla grande fija. Tamaño 16-20 px. | Dentro de botones y acciones en línea ("Guardando…") |
| **Silueta en movimiento** | Silueta simple de perro trotando (o gato saltando, alternando de forma aleatoria por sesión), con un ciclo de 2-4 cuadros o una animación de cuerpo y patas, más una línea de suelo que se desplaza bajo la silueta. | Cargas largas (más de 2 s), primer arranque y sincronización inicial |
| **Manchas** | Manchas orgánicas tipo dálmata o vaca que cambian de forma suavemente (border-radius o path animado), aparecen y se reacomodan en `--color-primary` y `--color-accent` a baja opacidad. | Pantalla de bienvenida, pull-to-refresh a pantalla completa y fondos de estados de espera |
| **Cola que se mueve** | Media silueta trasera de perro con la cola oscilando en ±20° con `--ease-playful`. | Pull-to-refresh: la cola se mueve más rápido mientras más se estira |
| **Radar con huella** | Huella al centro con 2-3 anillos que se expanden y desvanecen en `--color-danger`. | Exclusivo del modo mascota perdida: buscando reportes o avistamientos cercanos |

**Reglas de los loaders:**
- Mostrarlos solo si la espera supera `--loader-delay` (300 ms), y mantenerlos visibles al menos `--loader-min-visible` (500 ms) para evitar parpadeos.
- Si se conoce la forma del contenido, se usa skeleton y no un loader.
- Accesibilidad: el contenedor lleva `role="status"`, `aria-live="polite"` y una etiqueta como "Cargando lugares cercanos". La animación SVG lleva `aria-hidden="true"`.
- Con movimiento reducido, cada loader se reemplaza por su ícono estático (una huella o una silueta quieta) con un pulso suave de opacidad y el texto de estado.
- Se crean como componentes reutilizables: `<PawLoader />`, `<PawDotsLoader />`, `<PetSilhouetteLoader />`, `<SpotsLoader />`, `<TailRefresh />` y `<LostPetRadar />`, con props `size` y `label`.

## Modo mascota perdida

Al activar SOS, la app cambia de tono: el primario pasa a `--color-danger` y aparece un banner fijo con el tiempo transcurrido desde la pérdida. Las acciones de difundir (compartir, imprimir volante, avisar a la comunidad) quedan siempre visibles, y la búsqueda usa el loader de radar.

## Correcciones pendientes en las pantallas actuales

- **Inicio:** "Hoy le toca a [mascota]" va antes del banner promocional. El botón del banner usa `--color-on-primary` sobre `--color-primary` invertido para que se lea. Las tareas vencidas siguen la escala de severidad (hoy usan tres estilos distintos). El avatar de usuario lleva la inicial en mayúscula y usa `--color-primary-soft`. Ninguna categoría de "¿Qué necesitas?" usa rojo.
- **Mis mascotas:** la edad se muestra en formato legible y sin truncar. Hay que corregir la tilde de "Pastor Alemán" en los datos. "Añadir mascota" pasa a botón secundario o tarjeta con borde punteado cuando ya hay mascotas. Los chips se ordenan con lo urgente primero.
- **Explorar:** el mapa usa un estilo propio y muestra un skeleton mientras carga. Las categorías van en una fila y los filtros (distancia, calificación, precio) en un botón "Filtros" con contador. El título "Explorar" se muestra como encabezado, no como píldora. Los elementos de la hoja inferior no se superponen.
- **General:** el SOS se escribe en mayúsculas y con contraste alto. Hay que quitar el FAB de búsqueda duplicado en Explorar, aplicar `--content-bottom-padding` en todas las pantallas con scroll y verificar que el indicador de desarrollo de Next.js no aparezca en producción.
