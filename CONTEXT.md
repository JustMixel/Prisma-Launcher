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
- [x] **Configuration** completa: Perfil, Apariencia, Launcher y Acerca de.
- [ ] Resolver solapamiento texto/imagen de fondo en `.main-content`.
- [x] Ancho definitivo de la barra lateral: 240px.
- [x] La foto de perfil se trata dentro de Configuration (no en Store).
- [x] **ModPlayView** implementada: clic en `LibraryCard` abre la vista del mod instalado.
- [x] Descargas/local mods se registran en `<.prisma>/assets/(Mod name)/mod.json`; Library lee esos manifests desde Rust.
- [x] ModPlayView refinada: logo STEL3 centrado a escala (max 3528×1197 px, limitado por el natural 1280×720), **retrato removido** (mostraba el placeholder "700 x 1024" de placehold.co), fondo SC1 temporal, footer flex centrado.
- [x] **Pendientes Store resueltos**: filtros en cartas de perfil, prefs persistidas (`prisma-store-prefs`), ARIA en filtros, "Solo instalados" operativo, CSS huérfano limpio.
- [x] `DownloadsProvider` precarga `get_installed_mods` al arrancar → `library` disponible en Store (update badges + solo instalados) sin abrir Library.
- [x] **Fix settings**: `handleSettingChange` ahora mapea clave de storage → clave de estado (`SETTINGS_STATE_KEYS`); antes acento/fondo/pestañas no reaccionaban en la UI.
- [x] **Velo oscuro en `.main-content`**: gradiente `rgba(0,0,0,0.62)` sobre `app-base.png` para que el texto no compita con la imagen (pendiente de solapamiento resuelto).
- [x] **PCN F0+F2** (ver sección dedicada): login mock, canje de códigos, botón "Activar Proyecto" en Library y módulo Creator (sidebar + lista/crear/editar/gestión de códigos, testers y visibilidad).

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
- La **foto de perfil** deberá permitir al usuario cargar una imagen desde su computadora; se implementará **dentro de Configuration**.
- **Título "STORE" descartado**: no se implementará, aunque aparezca en el mock `Store_Screen.png`.
- **Ancho definitivo de la sidebar: 240px** (confirmado por el usuario).
- **Videos/Reviews** requieren **modelado de datos** antes de trabajar su UI; por ahora se mantienen como placeholders vacíos en `ModView`.
- La foto de perfil elegida en Configuration se guarda en `localStorage` (`prisma-profile-picture`) y se refleja en la sidebar.
- Preferencias locales en `localStorage` (`src/utils/settings.js`): fondo, color de acento, ruta de mods, recordar pestaña y pestaña inicial.
- Los mods instalados se registran como `<.prisma>/assets/(Mod name)/mod.json`; la Library los lee desde Rust (`get_installed_mods`).
- `ModPlayView` se abre al clickear un mod instalado en Library; rediseñada desde el mock `ModPlay_Screen.png`: logo STEL3 centrado (triple del tamaño inicial), gear (abrir carpeta) + botón **JUGAR** verde, footer "dev, año" y riel derecho de 3 iconos (home → biblioteca, gráfico → estadísticas, trofeo → logros). **Retrato removido** por decisión del usuario (solo mostraba el placeholder de placehold.co). `Jugar` usa `executablePath` o `m_link`.
- Botones de navegación con **borde solo al pasar el mouse (hover)**.
- Tipografía del sistema **Bahnschrift** con distintos pesos según el label.
- El área principal usará **`src/assets/app-base.png`** como imagen de fondo por defecto (configurable desde Configuration).
- Navegación por pestañas gestionada mediante **estado de React** (`useState`) en `App.jsx`.
- **Secciones separadas** en modo Desarrollador: Studios arriba, Productores abajo, cada uno con su título.
- Flujo de búsqueda por desarrollador: **texto → cartas de perfil → clic → mods del perfil** (no muestra mods directamente al escribir).
- **Publisher**: el uploader elige studio o su nombre propio; un solo campo (`m_producername`).
- Fechas de test en **ISO 8601 completo** (`...T12:00:00.000Z`).
- **Estadísticas en ModPlayView**: NO son stats de la store. El creador, al subir el mod, **habilitará la opción de lectura de estadísticas** y **especificará un archivo `.ini`** que llevará el conteo (misiones totales realizadas, etc.); la vista leerá ese archivo. Pendiente de adaptar (flujo de subida + lectura).
- Preferencia del usuario: explicar qué hacer y por dónde empezar; dar código solo si pide explícitamente que se implemente.

## Pendientes / Próximos Pasos (Store)
1. [x] Aplicar **filtros** (descargas/rating/fecha/tags/solo instalados) también a las cartas de perfil al navegar.
2. [x] **Persistir** filtros/orden/modo en `localStorage` (`prisma-store-prefs`, con validación al cargar).
3. [x] ARIA/labels en los inputs del panel de filtros (aria-label, aria-expanded, aria-pressed).
4. [x] "Solo instalados" activo: valida contra la `library` del contexto (el provider precarga `get_installed_mods`).
5. Búsqueda **server-side con debounce** (`/api/catalog?q=`) cuando haya datos reales.
6. Videos/Reviews en ModView → requiere **modelado de datos** previo (ver Decisiones Registradas).
7. [x] Limpiar CSS huérfano: eliminados `.releasedate` (Card) y `.filter-disabled` (Store); `.studio`, `.stats`, `.stat` sí están en uso.

## Pendientes globales (fuera del Store)
1. Resolver solapamiento texto/imagen de fondo en `.main-content`.
2. Comandos Tauri restantes: descarga real de archivos y shortcut (registro/lectura/ejecución ya implementados).
3. Modelado de datos para Videos/Reviews antes de implementar su UI.
4. Migración de endpoints mock a SQL Server real.
5. Assets de ModPlayView: `Mock/Main Screens/SC1.png` (1920×1080) como fondo temporal y `STEL3.png` (1280×720, fondo blanco) como logo de prueba; faltan PNG con alfa del logo del proyecto y del logo real del mod.
6. Estadísticas ModPlayView → flujo del `.ini` del creador (opción "leer estadísticas" + campo archivo `.ini` al subir; la vista lo lee). Ver Decisiones Registradas.

## Repositorio (git)
- Remoto: `https://github.com/JustMixel/Prisma-Launcher.git`.
- **`origin/main`** contiene un proyecto **distinto** (solución C# WinForms: `Prisma Launcher.sln`, `CapaDatos/`, `Forms/...`) subido por *force push* — historias sin relación con el Tauri.
- **`origin/dev`** es la rama del proyecto **Tauri + React** (historia: `c8f6fca` → `68e6386` → `45b958a` → `820c952`).
- **Decisión del usuario**: los commits del proyecto Tauri van a **`dev`**; `main` queda con el proyecto C# (sin tocar).
- Último push: commit "Store: profile filters, persisted search prefs, ARIA labels and installed-only filter" → `origin/dev`.

## Prisma Creator Network (PCN)
Módulo del launcher para crear, testear y gestionar mods + activación de proyectos ocultos por código.

### Decisiones
- UI: botón PCN en el **sidebar, abajo de todo** (`.sidebar-footer` con `margin-top:auto` y padding 12px), clase `.creator-btn`.
- Creación: **metadatos + archivos** (base del form AddLocalMod).
- Testeo: módulo propio (validar/lanzar/logs) + rol **Tester** otorgado por el desarrollador; los testers ven el botón **"Activar Proyecto"** en Library; los miembros normales no.
- Códigos: **multi-uso con límite** (opcional expiración); activan proyectos ocultos que no salen en la Store.
- Archivos: combinación **local + alojados en servidor** (F4).
- Identidad: **cuentas con login** (mock ahora, SQL después); el login/logout se hace **en el módulo PCN** (no en Configuration).
- Dueño/desarrollador: ve sus proyectos ocultos en su PCN **sin código** (hecho en F2).

### Estado
- [x] **F0 — modelo + endpoints mock**: `server/Routes/creatorRoutes.js` montado en `/api`:
  `POST /api/auth/login`, `POST /api/codes/redeem`, `GET /api/creator/projects`, `GET /api/users`.
  Seed: `dev/dev123` (developer), `tester/tester123` (tester), `user/user123` (member, `activated: false`), `tester2/tester123` (member activado, id 4); proyecto oculto `prj-1` con código `PRISMA-TEST` (100 usos, sin expiración, usado 1).
- [x] **F1 — canje en Library**: `src/utils/session.js` (sesión en `localStorage` `prisma-session`), botón **"Activar Proyecto"** en Library visible solo con rol `tester`, `RedeemProject.jsx` (buscar código → preview con usos restantes → activar → `addToLibrary` con `source: "code"`). **Login/logout vive en el módulo PCN** (sección "Cuenta Prisma" eliminada de Configuration).
- [x] Store: `/api/mods` y `/api/catalog` filtran `m_status === 'published'` (ocultos no aparecen).
- [x] **F2 — sidebar + módulo PCN**: botón **Creator** en el sidebar (abajo, `App.jsx` + `.sidebar-footer`/`.creator-btn` en `App.css`, ícono de red global + "Prisma Creator Network"), pestaña `"creator"` en `TABS`/`TAB_LABELS`, `src/components/Creator.jsx` + `Creator.module.css`:
  - **Vista principal rediseñada desde mock `Mock/Main Screens/PL_PCN_00.png`**: saludo **"¡Bienvenido, {displayName}!"** + 3 botones cuadrados arriba a la derecha (**Perfil** y **Configuración** → pestaña Configuration vía prop `onNavigate` pasada desde `App.jsx`; **Salir** con borde rojo → logout); sección **"Tus requests"** (heading centrado, tarjeta de invitación con **datos mock locales** `MOCK_REQUESTS` — flujo real pendiente) y sección **"Tus mods"** (heading centrado + botón outlined **"+ Nuevo proyecto"** a la derecha, filas con cover/nombre/meta/badge de visibilidad). Divisor sutil (`border-top`) entre secciones.
  - **Gate de rol**: sin sesión → **formulario de login dentro del propio PCN** (usuario/contraseña, cuentas de prueba, `handleLogin`/`handleLogout` en `Creator.jsx`); sesión no-developer → mensaje "solo desarrolladores" + botón Cerrar sesión; developer → módulo completo. En la lista, chip de cuenta (nombre + rol) + **Cerrar sesión** en el header.
  - **Lista**: proyectos con cover, categoría, versión, conteo de códigos/testers y badge de visibilidad (borrador/oculto/publicado).
  - **Crear/Editar** (form estilo AddLocalMod): nombre, descripción, categoría (reutiliza `CATEGORIES` exportado de `AddLocalMod.jsx`), portada (URL o archivo local vía `read_file_as_data_url` + `CustomFileDialog`), ruta del ejecutable (explorador), versión, archivo `.ini` de stats, tags (CSV), visibilidad inicial. Crear genera código inicial (`generateCodeMaxUses: 100`).
  - **Detalle**: editar / botón "Testear" **deshabilitado "Próximamente (F3)"**, secciones de **Visibilidad** (POST `/visibility`), **Códigos** (lista con usos restantes + copiar + generar con usos máximos) y **Testers** (chips quitar + select de miembros activados para asignar).
  - Endpoints gestión en `creatorRoutes.js`: `POST /creator/projects`, `PATCH /:id`, `POST /:id/visibility`, `POST /:id/codes` (genera `PCN-XXXXXXXX`), `POST /:id/testers` (add/remove, valida `activated`); respuestas `{project}` o `{code}`; errores como códigos (`missing_fields`, `not_activated`, `invalid_max_uses`, etc.) mapeados a español en `API_ERRORS` de `Creator.jsx`.
  - Smoke test OK (login, list, create, patch, visibility, codes, testers add/remove, validaciones 400/404).
- [ ] **F3**: módulo de testeo (validar estructura/ini, lanzar, logs).
- [ ] **Requests/invitaciones**: flujo real (endpoint + modelo) para la sección "Tus requests" — ahora es mock local `MOCK_REQUESTS` en `Creator.jsx`.
- [ ] **F4**: subida/descarga real de archivos (Tauri + servidor).
- [ ] **F5**: integración Store completa + cuentas/roles reales (SQL).

## Comandos
- Frontend: `npm run build` (raíz del proyecto).
- Servidor: `node index.js` **desde `server/`** (dotenv falla desde la raíz). Reiniciar tras editar mocks (los datos se cargan al arrancar).
- **Si el login falla con "No se pudo conectar con el servidor"**: verificar que el proceso node del puerto 3000 sea actual (`GET /api/auth/login` debe responder, no 404) — matar el viejo (`Stop-Process -Id <pid>`) y relanzar `node index.js`.
- Sintaxis rutas: `node --check Routes/launcherRoutes.js` y `node --check Routes/creatorRoutes.js` (desde `server/`).

## Relevo para siguiente modelo — Store y búsqueda
- **Estado**: Store funcional con búsqueda (nombre/desarrollador), filtros, secciones de perfiles, flujo perfil→mods, ModView y countdown.
- **Detalle completo** en esta hoja, sección "Store — estado funcional" y "Pendientes / Próximos Pasos (Store)".
- **Preferencia del usuario**: explicar qué hacer y por dónde empezar; dar código solo si pide explícitamente que se implemente.
- **UI en español**; feedback en vivo de ajustes finos (posición/tamaño de texto del badge, etc.) — responde con cambios pequeños y build inmediato.
- **Fecha de test** en ISO 8601 completo; reiniciar servidor Node tras tocar mocks.
- API mock en `server/Routes/launcherRoutes.js`: `/api/catalog`, `/api/mods`, `/api/mods/:id`, `/api/mods/:id/versions`.
- Arquitectura acordada: catálogo en Node; Library, instalación y shortcut en Rust/Tauri.
- Decisiones nuevas: **STORE descartado**, sidebar **240px**, pfp en **Configuration**, Videos/Reviews requieren **modelado de datos**.
- Comandos: `npm run build`; servidor desde `server/` con `node index.js`.
