# Prisma Launcher - Contexto del Proyecto

> Hoja de contexto acumulativa. Se actualiza progresivamente conforme avanza el desarrollo.

## Stack Tecnológico
- **Framework:** Tauri v2 + Vite + React
- **Frontend:** React 19 (JSX)
- **Backend:** Rust (Tauri commands y plugins)
- **Convenciones React:**
  - En JSX se usa **`className`** (no `class`).
  - Un componente debe retornar **un único elemento raíz** que envuelva a los demás.
  - `src/main.jsx` es el punto de entrada que importa y renderiza `App` desde `src/App.jsx`.

## Estructura Relevante del Proyecto
- `src/App.jsx` — Componente principal donde se construye el frontend.
- `src/App.css` — Estilos de la aplicación.
- `src/main.jsx` — Punto de entrada (no tocar).
- `src/assets/` — Imágenes e iconos del frontend.
- `src-tauri/src/lib.rs` — Backend Rust (commands, plugins).
- `src-tauri/tauri.conf.json` — Configuración de la app.
- `CONTEXT.md` — Esta hoja de contexto del proyecto.

## Diseño - Pantalla Principal (Main Screen)
Basado en el mock `Mock/Main Screens/Main_Screen.png`.

**Estructura del layout:**
```
┌────────────┬──────────────────────────────────┐
│  Barra     │                                  │
│  lateral   │                                  │
│  [Foto]    │     Contenido principal          │
│  [Nombre]  │        (fondo con imagen)        │
│  [Rol]     │                                  │
│  [1][2][3] │                                  │
│  [4]       │                                  │
└────────────┴──────────────────────────────────┘
```

### Detalles de diseño
- **Barra lateral:** fondo **gris oscuro** en general.
- **Recuadro de usuario** (dentro de la barra): fondo **gris claro**.
  - Contiene: foto de perfil (circular), nombre de usuario y rol activo.
  - Layout horizontal: foto centrada y el texto (nombre + rol) a la derecha.
- **Botones:** 4 botones de navegación, bien separados entre sí.

### Tipografía (Bahnschrift)
- **Nombre de usuario** (`h3`): **Bold** (700)
- **Rol activo** (`p`): **Thin** (100)
- **Botones** (`nav-btn`): **Regular** (400)

### Estilos aplicados (App.css)
- `.sidebar`: fondo gris oscuro, `width` ajustable (actual 220px), sin `align-items: center`.
- `.user-box`: fondo gris claro, flex horizontal, sin borde visible.
- `.profile-pic`: circular (`border-radius: 50%`), con `object-fit: cover`.
- `.nav-btn`: `width: 100%`, `height`, `border: none` en estado normal, **borde solo en hover** (`:hover`).

### Botones actuales (nombres provisionales en código)
Store, Library, Downloads, Configuration.

## Navegación entre Pestañas
- **Estado de React:** `useState` con `activeTab` (inicial: `"store"`).
- **Identificadores de pestaña:** `store`, `library`, `downloads`, `configuration`.
- **Cada botón** tiene `onClick={() => setActiveTab("...")}` y una clase condicional:
  `className={activeTab === "store" ? "nav-btn active" : "nav-btn"}`.
- **El `<main>`** renderiza contenido condicional con `&&` según `activeTab`.
- Estilo del botón activo: clase `.active` (definir en `App.css`, pendiente).
- **IMPORTANTE:** los 4 botones DEBEN tener el `onClick` y la clase condicional; uno sin ello no cambia de pestaña.

## Assets del frontend
- `src/assets/app-base.png` — imagen de fondo del área principal.
- `src/assets/pfp-test.png` — foto de perfil de prueba (circular).
- `src/assets/react.svg` — logo de plantilla (sin uso actual).

## Estado Actual (Avance)
- [x] Estructura base JSX del Main Screen (container + sidebar + main).
- [x] Recuadro de usuario (foto + nombre + rol) con `.user-info`.
- [x] 4 botones de navegación añadidos (Store, Library, Downloads, Configuration).
- [x] Estilos base en `App.css` (layout flex, colores, foto circular, botones espaciados).
- [x] Estado `activeTab` + todos los botones con `onClick` y clase activa.
- [x] Definida clase `.nav-btn.active` en `App.css`.
- [x] **Servidor Node/Express** levantado en `server/` con conexión a SQL Server (auth Windows) usando `mssql` + `msnodesqlv8`.
- [x] Rutas organizadas en `server/Routes/launcherRoutes.js` montadas bajo `/api/`.
- [x] Endpoint `GET /api/mods` con datos mockeados.
- [x] Middleware de logging añadido en `server/index.js`.
- [x] **Frontend conectado al servidor**: `Store.jsx` usa `useState` + `useEffect` para hacer `fetch()` a `http://localhost:3000/api/mods` y renderiza con `.map()`.
- [x] `Card.jsx` hecho dinámico con props (`title`, `publisher`, `producer`).
- [x] **Búsqueda/filtros del Store** (ver sección dedicada más abajo).
- [x] **ModView** implementada desde mock (ver `IDEAS.md`).
- [x] **Secciones Studios/Productores** en modo Desarrollador.
- [x] **Flujo perfil → mods** en modo Desarrollador (`viewingEntity`).
- [x] **Countdown real** en badge de `Card` desde `m_releasedate`.
- [ ] Contenido de cada pantalla dentro del `<main>` (Library/Downloads/Configuration con placeholders).
- [ ] Resolver solapamiento texto/imagen de fondo en `.main-content`.
- [ ] Definir anchura definitiva de la barra lateral.
- [ ] Pendiente decidir si la pfp se selecciona en memoria o se persiste vía Rust.

## Store — estado funcional (detallado)

### Búsqueda
- **Modo de búsqueda** (`searchMode`, radio en panel de filtros): `name` | `developer`.
- Normalización de acentos + multi-palabra (`src/utils/search.js`: `normalizeText`, `tokenize`, `matchesTokens`).
- **Modo Nombre**: busca en `m_name` + `m_producername`.
- **Modo Desarrollador**: navega **perfiles** (no mods):
  - Vacío → dos secciones con encabezado: **Studios** (devgroups) y **Productores** (producers individuales), cartas `StudioCard`.
  - Texto → filtra las cartas de perfil por nombre.
  - **Clic en carta de perfil** → estado `viewingEntity {kind, id, name}` → se muestran los mods de esa entidad (por `m_devgroupid`/`m_producerid` + filtros activos) con el nombre como encabezado.
  - Volver: editar/borrar el texto (✕), cambiar modo o elegir sugerencia limpian `viewingEntity`.
- Resaltado de coincidencias con `<mark>` vía componente `Highlight`.
- Sugerencias con ↑/↓/Enter/Escape; búsquedas recientes en `localStorage` (`prisma-recent-searches`, máx 8).
- Estados de fetch: `loading | ready | error`; estado vacío con `«término»`.

### Filtros (panel del embudo 🟡)
- Radios: Buscar por (Nombre/Desarrollador) y Ordenar (Alfabético/Descargas/Recientes).
- Descargas mín., Rating mínimo, Lanzado desde, chips de tags (OR).
- "Solo instalados" deshabilitado (pendiente de Library).
- "Limpiar todo" resetea filtros+orden (no `searchMode`).
- Punto amarillo en el embudo si `filtersActive`.
- **Pendiente**: los filtros aún NO afectan las cartas de perfil (Studios/Productores) al navegar, solo los mods.

### Z-index / capas
- `.search-bar`: `position: relative; z-index: 50` (con `filter-panel` z-index 10 y suggestions 30 dentro) para que quede **encima** de las cards (cuyas capas llegan a z-index 3). Sin esto, badge/gradiente/textos de las cards tapaban el menú de filtros.

### Countdown (badge rojo diagonal de Card)
- `formatCountdown(releasedate)` en `Card.jsx`: calcula `Xd XXh XXm` desde `m_releasedate`; se actualiza cada 30 s.
- **Badge solo si la fecha es futura** (antes salía siempre con placeholder `--d --h --m`).
- Fecha de test: mod 1 *Syndicate: The Empire* → `m_releasedate: '2026-11-20T12:00:00.000Z'` (**ISO 8601 completo con Z/milisegundos**; formato sin `Z` fue rechazado por el usuario como no estándar).
- Texto `.release-badge-time`: `transform: translate(74px, 1.7px)` (badge rotado 45°; ajustes finos: bajado,0.3 px subido en la diagonal), `font-size: 16px` (11 → 14 → 16).
- Glow al parpadear cuando cambia el valor del countdown (sin cambios).

### Publisher en cards (decisión)
- **No mostrar studio+productor separados**: quien sube el mod elige **un** nombre (studio o el suyo) y ese va en `m_producername`; la card ya lo pinta. `publisher` se pasa a `Card` pero no se usa (a propósito).

### API mock (server/Routes/launcherRoutes.js)
- `/api/catalog`, `/api/mods` (legacy), `/api/mods/:id`, `/api/mods/:id/versions`.
- `buildLegacyMod` incluye: `m_cover`, `m_devgroupname`, `m_devgrouplogo`, `m_producername`, **`m_producerlogo` (nuevo: `avatar_url` de producers)**, `m_link`.
- Mods mock: 1) *Syndicate: The Empire* (producer 7 Mixel, devgroup 3 Prisma Interactive, tags, fecha futura de test), 2) *Neon Drift* (producer 12 Marcelo, sin devgroup, `m_releasedate: null`, tags).
- Producers: 7 Mixel, 12 Marcelo (`avatar_url: null` → logo por defecto). Devgroup: 3 Prisma Interactive (logo placehold.co).

## Decisiones Registradas
- La **foto de perfil** deberá permitir al usuario cargar una imagen desde su computadora y asignarla en el launcher (integración futura con backend Rust para persistencia).
- Botones de navegación con **borde solo al pasar el mouse (hover)**.
- Tipografía del sistema **Bahnschrift** con distintos pesos según el label.
- El área principal usará **`src/assets/app-base.png`** como imagen de fondo.
- Navegación por pestañas gestionada mediante **estado de React** (`useState`) en `App.jsx`.
- **Secciones separadas** en modo Desarrollador: Studios arriba, Productores abajo, cada uno con su título.
- Flujo de búsqueda por desarrollador: **texto → cartas de perfil → clic → mods del perfil** (no muestra mods directamente al escribir).
- **Publisher**: el uploader elige studio o su nombre propio; un solo campo (`m_producername`).
- Fechas de test en **ISO 8601 completo** (`...T12:00:00.000Z`).
- Preferencia del usuario: explicar qué hacer y por dónde empezar; dar código solo si pide explícitamente que se implemente.

## Pendientes / Próximos Pasos (Store)
1. **Título "STORE"** centrado arriba (existe en mock `Store_Screen.png`, no en el JSX).
2. Aplicar **filtros** (descargas/rating/fecha/tags) también a las cartas de perfil al navegar.
3. **Persistir** filtros/orden/modo en `localStorage` (solo recientes se guardan hoy).
4. ARIA/labels en los inputs del panel de filtros.
5. "Solo instalados" → requiere Library + Rust (`get_library`).
6. Búsqueda **server-side con debounce** (`/api/catalog?q=`) cuando haya datos reales.
7. Videos/Reviews en ModView (sin fuente de datos).
8. Limpiar CSS huérfano en `Card.module.css` (`.studio`, `.releasedate`, `.stats`, `.stat`) o usarlo.

## Pendientes globales (fuera del Store)
1. Contenido real de Library/Downloads/Configuration (placeholders actuales).
2. Resolver solapamiento texto/imagen de fondo en `.main-content`.
3. Anchura definitiva de la barra lateral.
4. Carga de pfp del usuario (memoria vs persistencia Rust).
5. Comandos Tauri en Rust (`src-tauri/src/lib.rs` solo tiene `greet`): Library, instalación, shortcut.
6. Migración de endpoints mock a SQL Server real.

## Comandos
- Frontend: `npm run build` (raíz del proyecto).
- Servidor: `node index.js` **desde `server/`** (dotenv falla desde la raíz). Reiniciar tras editar mocks (los datos se cargan al arrancar).
- Sintaxis rutas: `node --check Routes/launcherRoutes.js` (desde `server/`).

## Relevo para siguiente modelo — Store y búsqueda
- **Estado**: Store funcional con búsqueda (nombre/desarrollador), filtros, secciones de perfiles, flujo perfil→mods, ModView y countdown.
- **Detalle completo** en esta hoja, sección "Store — estado funcional" y "Pendientes / Próximos Pasos (Store)".
- **Preferencia del usuario**: explicar qué hacer y por dónde empezar; dar código solo si pide explícitamente que se implemente.
- **UI en español**; feedback en vivo de ajustes finos (posición/tamaño de texto del badge, etc.) — responde con cambios pequeños y build inmediato.
- **Fecha de test** en ISO 8601 completo; reiniciar servidor Node tras tocar mocks.
- API mock en `server/Routes/launcherRoutes.js`: `/api/catalog`, `/api/mods`, `/api/mods/:id`, `/api/mods/:id/versions`.
- Arquitectura acordada: catálogo en Node; Library, instalación y shortcut en Rust/Tauri.
- Comandos: `npm run build`; servidor desde `server/` con `node index.js`.
