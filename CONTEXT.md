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
- Preferencias locales en `localStorage` (`src/utils/settings.js`): tipo de fondo, color/gradiente/imagen de fondo, color de acento, overrides de colores, ruta de mods, recordar pestaña y pestaña inicial.
- **Apariencia (Configuration) se organiza en 2 tabs** (estado local `aparienciaTab` en `Configuration.jsx`, por defecto "fondo"): **"Imagen de fondo"** y **"Colores"**.
  - **Tab "Imagen de fondo"** — segmentado **Tipo de fondo** con 3 opciones: **Color sólido** (`prisma-custom-background-color`, `input color` + campo hex editable vía componente `HexColorInput`), **Gradiente** (`prisma-custom-gradient` = JSON `{from, to, angle}`; preview en vivo + 2 selectores Desde/Hasta + slider de ángulo 0–360° con track arcoíris) e **Imagen** (`prisma-custom-background-image`; hint **1920×1080 px (16:9)**, formatos PNG/JPG/JPEG/WEBP/BMP/**GIF animado**; se copia con el comando Rust `save_background_image` a `<.prisma>/backgrounds/background.<ext>` y se sirve vía **asset protocol** — `tauri.conf.json`: `app.security.assetProtocol.enable` + scope `$HOME/AppData/Roaming/.prisma/**`, feature **`protocol-asset`** en `Cargo.toml`; `App.jsx` usa `convertFileSrc` y acepta también data: URLs; botón **Quitar**; sin imagen → fondo por defecto `app-base.png` + velo 0.62). Clave `prisma-background-type` (default `"image"`) decide el modo en `backgroundStyle` de App.jsx.
  - **Tab "Colores"** — el inventario completo de colores del launcher agrupado en **6 familias / 37 entradas** (`src/utils/colors.js`: `COLOR_GROUPS` con id, `label` **"Color N"** + `subtitle` (**Gris/Negro/Amarillo/Dorado/Verde/Rojo** — sin corchetes), y entradas `Sub-color M` (sin corchetes; el uso va en `where`) + `cssVar` + `value`): **Color 1 · Gris** (17 sub: superficies/bordes/textos), **Color 2 · Negro** (2), **Color 3 · Amarillo** (`--accent` con `accent: true` escribe en `prisma-accent-color` + acento claro con **`deriveFrom: "acento"`**), **Color 4 · Dorado** (3), **Color 5 · Verde** (6), **Color 6 · Rojo** (5). El encabezado de cada familia muestra **título + subtítulo**. Cada entrada: `input type=color` + label + dónde se usa + hex; botón **Restablecer** por familia y **Restablecer todos los colores**. **Sub-color 2 del acento depende del Sub-color 1**: se calcula en vivo con `lightenHex(accent)` (mezcla 25% con blanco) — el picker de esa entrada está **deshabilitado** y el valor se inyecta en `--c-accent-claro` desde App.jsx (`.container` style), por lo que al cambiar el acento (picker libre) el derivado se actualiza al instante. El acento se edita **solo** con el `input type=color` (libre) — se quitaron los presets rápidos. Los defaults viven en `:root` (App.css) como `--c-*`; los overrides se guardan en `prisma-color-overrides` (JSON) y se inyectan como variables inline en `.container` (App.jsx) — **aplican al instante en todos los módulos**. Los ~150 colores sueltos del código fueron migrados a `var(--c-*, default)` por script (CSS + JSX, excepto `Configuration.jsx`/`App.jsx`); los `rgba()` de efectos se quedaron hardcodeados. `--accent-color` (Card/StudioCard) unificado a `--accent`.
- Los mods instalados se registran como `<.prisma>/assets/(Mod name)/mod.json`; la Library los lee desde Rust (`get_installed_mods`).
- `ModPlayView` se abre al clickear un mod instalado en Library; rediseñada desde el mock `ModPlay_Screen.png`: logo STEL3 centrado (triple del tamaño inicial), gear (abre panel **Configuración del mod**) + botón **JUGAR** verde, footer "dev, año" y riel derecho (home → biblioteca, gráfico → estadísticas, trofeo → logros, **4to ícono descarga solo si hay update**). **Retrato removido** por decisión del usuario (solo mostraba el placeholder de placehold.co). `Jugar` usa `executablePath` o `m_link`.
- **Descargas retail/updates** (decisión del usuario): cada mod tiene **dos tipos de link** — **descarga principal** (paquete completo, siempre en su última versión; `m_link` en la Store / `downloadMain` en PCN) y **descarga update** (solo archivos necesarios para actualizar a esa versión; `m_update.download_url` / `downloadUpdate`). En **Library**, si la Store publica una update más nueva que la instalada → **badge "Update (vX)"** en la `LibraryCard` (polling `/api/mods` cada 60 s; `libraryItem.version` usa `m_version` retail primero para que el badge compare bien). **ModPlayView — vista del jugador (post-feedback)**: **"Descarga Principal" eliminada** (pill superior y opción del panel) — "el jugador no tiene porque ver ese tipo de cosas"; solo quedan controles de **update**: (1) **"ACTUALIZAR · {nombre o versión}"** a la izquierda de JUGAR, **solo si hay update**, con **color del tema** (`var(--accent)` de Configuration → Apariencia; texto/borde `#111`); (2) **4to botón del riel**, **solo si hay update**, también con color de acento → panel **"Descargas"** con la opción "Descarga update"; (3) el gear abre el panel **"Configuración del mod"** ("Abrir carpeta del mod" + estado **"AL DÍA"** o nombre de la update en acento; ya **no** hay botón "AL DÍA" deshabilitado en la fila de acciones). El nombre de la update sale de `getUpdateName()` (campo `display`: nombre si existe, si no versión). Form PCN: grupo **"Descargas"** con `downloadMain` y `downloadUpdate` (solo lo ve el desarrollador). Mocks: URLs `https://prisma.example/downloads/...` (`-full.zip` / `-patch.zip`).
- Botones de navegación con **borde solo al pasar el mouse (hover)**.
- Tipografía del sistema **Bahnschrift** con distintos pesos según el label.
- El área principal usará **`src/assets/app-base.png`** como imagen de fondo por defecto (configurable desde Configuration).
- Navegación por pestañas gestionada mediante **estado de React** (`useState`) en `App.jsx`.
- **Escritorio = pantalla principal** (pedido del usuario): nuevo tab `home` (**"Escritorio"**, `src/components/Home.jsx`) — botón con **ícono de casa** arriba en la sidebar (`.nav-btn.home-btn`), primera posición del nav. Es la **pestaña inicial por defecto** (`startupTab`/`lastTab` default `"home"`). Muestra los mods instalados en **grid tipo accesos directos** (cover o inicial, nombre y estado: Listo / Enlace / Sin ejecutable / Ejecutando…); **hacer clic ejecuta el mod directamente** (igual que el botón JUGAR de ModPlayView: `launch_executable` con `executablePath`, si no `openUrl(mod.link)`, si no mensaje de error) — **no** abre ModPlayView. Merge `library` (DownloadsContext) + `get_installed_mods`, mismo patrón que Library. Estado vacío con mark + "Tu escritorio está vacío". **Aquí se generarán los ejecutables de los mods** (pendiente: accesos directos/shortcut, ver Pendientes). Etiqueta "Escritorio" añadida a `TAB_LABELS` (Configuration → pestaña inicial).
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

## File Server (Storage Manager: Tigris)
Sistema para que la PCN suba los `.zip`/`.rar` de los mods (y eventualmente assets) a un fileServer propio. **Decisión actual del usuario (23/11)**: migrar de Yeap Cloud a **Tigris** (S3-compatible), con bucket público **`prisma-mods`** y **límite operativo de 4.5 GB de 5 GB**. Las access keys se pegan en la PCN y se guardan en **Tauri Stronghold**; no se crea cuenta ni se sube nada con Mail.tm.

> Historical: el diseño original usaba Mail.tm + Yeap Cloud (`modsforme`, 9.5 GB de 10 GB). La API de Yeap sigue en 502, así que ese flujo quedó como legado (`mailtm.js` / `yeapcloud.js` ya no se importan desde `storageManager.js`).

- **Autorización**: carta oficial de **Igor Gadovich** (Senior Cloud Engineer de Yeap Cloud) en `prompt_requests/note.md` + `yeap_cloud_igor_note.webp` autorizando el uso de Mail.tm para registro/verificación en su plataforma. La carpeta `prompt_requests/` está en `.gitignore` (commit `cb8449c`, notas locales, no versionadas). Nota: me equivoqué al citarla al principio — son **3 condiciones** (uso técnico/experimental, sin datos confidenciales, responsabilidad del colaborador), no 5.
- **Límites asumidos**: se automatiza el flujo **legítimo** de verificación (correo → link oficial → `verify-email`); **no** se automatiza salto de CAPTCHA/checks anti-bot — si el server pide `captcha_required`, se hace backoff y se avisa.
- **Fase 1 — investigación (hecha)**:
  - Mail.tm: `GET /domains` (exige User-Agent, si no 403), `POST /accounts`, `POST /token`, `GET /messages`, `GET /messages/{id}`. 8 QPS por IP; rate-limit intermitente 403 con cuerpo vacío (Caddy) → esperar y reintentar. Dominio activo real: `euploading.com`.
  - Yeap Cloud: API base **`https://api.yeap.cloud`** (Bearer + header `X-Device-Id`). Auth: `POST /auth/register` (`{email,password}` → `verification_sent`), `POST /auth/verify-email` (`{token}`), `POST /auth/login` (`{username,password,cfkey,remember}` → `token`+`refresh_token`; `cfkey` = token de verificación de humanness del console, y hay rate-limit con `captcha_required`), `POST /auth/resend-verification`. S3 admin bajo **`/api/user/s3`**: `GET/POST /buckets` (`{region_id,name}` 3–63 minúsculas/guiones, sin `yc-`), `GET /regions`, `GET/POST /keys` (`read`/`readwrite`/`admin`), `/overview`, `/usage`. Endpoint S3 `https://slc1.s3.yeapcloud.com`, región `slc1`. Extraído del bundle de `console.yeap.cloud` (24 MB).
  - ⚠️ **Estado de la prueba en vivo**: Mail.tm validado al 100% (buzón creado: `prisma473035@euploading.com`, token y `/messages` OK). La API de Yeap sigue devolviendo **502** en todas las rutas (revisado de nuevo el 23/11) — el registro real, bucket, access key y subida quedan pendientes de que vuelva.
- **Fase 2 — código (hecha, `e3352f5`)**: `src/utils/fileserver/mailtm.js` (dominios, buzón, token, mensajes, `extractVerificationLink`, `waitForVerificationMessage` con polling) y `src/utils/fileserver/yeapcloud.js` (`registerAccount`, `verifyEmail`, `login`, S3 buckets/regions/keys/overview, `extractVerifyToken`). HTTP con `fetch` nativo (CSP `null`, ya se usa en Creator/Store).
- **Fase 3 — secretos (hecha)**: `save_secret`/`load_secret`/`delete_secret` migrados a **Tauri Stronghold** (`Cargo.toml`: `tauri-plugin-stronghold 2.4.0` con `kdf`, `iota_stronghold 2.1.0`, `keyring 3.6.3` con `windows-native`). El cofre cifrado es `<.prisma>/vault.stronghold`, la sal Argon2 en `<.prisma>/stronghold.salt` y la contraseña maestra se guarda en el **Windows Credential Manager** (`PrismaLauncher`/`stronghold-master`), nunca en código ni en el frontend. `load_secret()` migra de forma transparente los valores antiguos de `<.prisma>/secrets.json` (AES-256-GCM) y elimina la entrada legacy. Tinyvec se fijó a 1.13.3 en `Cargo.lock` para evitar un error de compilación con la toolchain actual. `cargo check --manifest-path src-tauri\Cargo.toml` OK.
- **Fase 4 — subida S3 (hecha, `c5ac56a`)**: `src/utils/fileserver/s3.js` (firma SigV4 con WebCrypto, PUT simple + multipart), `src/utils/fileserver/storageManager.js` (orquestador Mail.tm → Yeap → bucket → access key → upload) e integración en la PCN (`Creator.jsx` / `Creator.module.css`) con campos para pegar la Secret Key si Yeap no la devuelve.
- **Fase 5 — regresión SigV4 (hecha, `cd810c1`)**: `tests/sigv4.test.mjs` con los vectores oficiales de `aws4`; `npm test` pasa. Corrección real: la firma debe usar el valor final de `x-amz-content-sha256` cuando el llamador lo sobrescribe.
- **Fase 6 — auth alineada al console (hecha, `b6efffc`)**: `registerAccount()` envía `username`, `login()` usa `cfkey: null` por defecto, `X-Device-Id` es una huella SHA-256 local guardada en `yc_did` y `request()` detecta `success:false`/`captcha_required` (sin automatizar CAPTCHA).
- **Fase 7 — migración a Tigris (en curso)**: `storageManager.js` ya no depende de Mail.tm/Yeap. Config fija: endpoint `https://t3.storage.dev`, región `auto`, bucket `prisma-mods` (sin puntos), URL pública `https://<bucket>.t3.tigrisbucket.io/<clave>`. `saveManualCredentials()` valida prefijos `tid_` / `tsec_`. `s3.js` acepta `publicBase` para la URL pública y agregó `getBucketUsage()` (ListObjectsV2 paginado) para mostrar el espacio real y frenar subidas por encima de 4.5 GB. La PCN muestra pasos de alta, campos de bucket/keys, uso actual y botón «Actualizar uso».
  - ⚠️ Tigris exige MFA al crear cuenta y, para **buckets públicos**, verificación de método de pago (organizaciones creadas después del 18/05/2026). El free tier son 5 GB/mes + 10k Class A + 100k Class B requests y egress gratis; no hay cargo dentro del límite.
  - ⚠️ MediaFire fue evaluado y descartado: la app de ejemplo de su API (`application_id=41629`) está deshabilitada (`error 145`) y el portal de Developers no aparece en cuentas nuevas, así que no hay forma confiable de subir por API.
- **Decisión del usuario**: prueba en vivo = **sí, completa**; credenciales del fileServer = **Tauri Stronghold** (implementado en Fase 3).

## Pendientes globales (fuera del Store)
1. Resolver solapamiento texto/imagen de fondo en `.main-content`.
2. Comandos Tauri restantes: descarga real de archivos y shortcut (registro/lectura/ejecución ya implementados).
2b. **Escritorio: generar los ejecutables/atajos de los mods** (el usuario indicó que ahí se generarán); hoy solo lanza `executablePath` registrado en el `mod.json`.
3. Modelado de datos para Videos/Reviews antes de implementar su UI.
4. Migración de endpoints mock a SQL Server real.
5. Assets de ModPlayView: `Mock/Main Screens/SC1.png` (1920×1080) como fondo temporal y `STEL3.png` (1280×720, fondo blanco) como logo de prueba; faltan PNG con alfa del logo del proyecto y del logo real del mod.
6. Estadísticas ModPlayView → flujo del `.ini` del creador (opción "leer estadísticas" + campo archivo `.ini` al subir; la vista lo lee). Ver Decisiones Registradas.
7. [x] **Customización de colores** (implementado): inventario en `src/utils/colors.js` (6 familias / 37 entradas) expuesto en Configuration → Apariencia → tab **"Colores"**, con encabezado **título "Color N" + subtítulo de familia** (sin corchetes), `input type=color` + hex + "dónde se usa" por entrada, Restablecer por familia y Restablecer todos; defaults en `:root` (`--c-*`), overrides en `prisma-color-overrides` inyectados en `.container`. El **Sub-color 2 del acento se deriva del Sub-color 1** (`deriveFrom` + `lightenHex`, picker bloqueado, inyectado en App.jsx). El tab **"Imagen de fondo"** ofrece Color sólido / Gradiente (ángulo 0–360°) / Imagen. Ver Decisiones Registradas.

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
- **Metadata del mod (decisión del usuario, ver lista abajo)**:
  - **Descripción en Markdown** con HTML permitido (imágenes/GIFs); sanitizar al renderizar (XSS).
  - **Fecha de lanzamiento** como campo (alimenta countdown de Store y "año" en ModView): el usuario elige entre **"Lanzar hoy"** o **"Fecha programada"**; si elige fecha programada, además decide si muestra la **badge de cuenta regresiva** en la Store o un **conteo silencioso** (sin badge). Modelo: `m_releasedate` + flag de badge (p. ej. `countdownBadge: boolean`).
  - **Publicar como**: si el usuario pertenece a un **grupo de desarrollo**, puede elegir publicar bajo **su nombre o el del grupo** (`m_producername`); si no, su nombre. Grupos: **crear / unirse / invitar** (vista Grupos, pendiente).
  - **Visibilidad fuera del form**: al crear siempre **"Oculto"**; se cambia desde el detalle.
  - **Assets subibles por proyecto**: portada, **banner de Store**, **icono** (ya modelado en `m_assetids.icon`; es también la imagen del ejecutable en el escritorio del launcher), **logo** (ModPlayView), **imagen de Library**, **hover image** y **hover music** (`m_assetids.hover_background`/`hover_music` ya existen), **galería de screenshots**, **trailer**.
  - **ModView**: la pestaña **"Videos" pasa a "Media"** con separación clara (estilo launcher) entre **imágenes** y **videos**; cada media tiene campos **opcionales** de nombre y descripción.
  - **Metadata extra en el form**: créditos (equipo/colaboradores), enlaces (web/Discord/YouTube), requisitos/dependencias, changelog/notas de versión, idioma(s). **Licencia descartada** (no aplica).

### Estado
- [x] **F0 — modelo + endpoints mock**: `server/Routes/creatorRoutes.js` montado en `/api`:
  `POST /api/auth/login`, `POST /api/codes/redeem`, `GET /api/creator/projects`, `GET /api/users`.
  Seed: `dev/dev123` (developer), `tester/tester123` (tester), `user/user123` (member, `activated: false`), `tester2/tester123` (member activado, id 4); proyecto oculto `prj-1` con código `PRISMA-TEST` (100 usos, sin expiración, usado 1).
- [x] **F1 — canje en Library**: `src/utils/session.js` (sesión en `localStorage` `prisma-session`), botón **"Activar Proyecto"** en Library visible solo con rol `tester`, `RedeemProject.jsx` (buscar código → preview con usos restantes → activar → `addToLibrary` con `source: "code"`). **Login/logout vive en el módulo PCN** (sección "Cuenta Prisma" eliminada de Configuration).
- [x] Store: `/api/mods` y `/api/catalog` filtran `m_status === 'published'` (ocultos no aparecen).
- [x] **F2 — sidebar + módulo PCN**: botón **Creator** en el sidebar (abajo, `App.jsx` + `.sidebar-footer`/`.creator-btn` en `App.css`, ícono de red global + "Prisma Creator Network"), pestaña `"creator"` en `TABS`/`TAB_LABELS`, `src/components/Creator.jsx` + `Creator.module.css`:
  - **Vista principal rediseñada desde mock `Mock/Main Screens/PL_PCN_00.png`**: saludo **"¡Bienvenido, {displayName}!"** + 4 botones cuadrados arriba a la derecha en orden: **Grupos de desarrollo** (ícono de personas, primero) → vista interna `view === "groups"` placeholder "próximamente", **Perfil** y **Configuración** → pestaña Configuration vía prop `onNavigate` pasada desde `App.jsx`, **Salir** con borde rojo → logout; sección **"Tus requests"** (heading centrado, tarjeta de invitación con **datos mock locales** `MOCK_REQUESTS` — flujo real pendiente) y sección **"Tus mods"** (heading centrado + botón outlined **"+ Nuevo proyecto"** a la derecha, filas con cover/nombre/meta/badge de visibilidad). Divisor sutil (`border-top`) entre secciones.
  - **Gate de rol**: sin sesión → **formulario de login dentro del propio PCN** (usuario/contraseña, cuentas de prueba, `handleLogin`/`handleLogout` en `Creator.jsx`); sesión no-developer → mensaje "solo desarrolladores" + botón Cerrar sesión; developer → módulo completo. En la lista, chip de cuenta (nombre + rol) + **Cerrar sesión** en el header.
  - **Lista**: proyectos con cover, categoría, versión, conteo de códigos/testers y badge de visibilidad (borrador/oculto/publicado).
  - **Crear/Editar** (rediseñado desde mock `Mock/Main Screens/PL_PCN_01.png`): el form **mantiene la welcome bar** (extraída a `renderWelcomeBar()`, compartida con la lista), título centrado **"Nuevo Mod" / "Editar Mod"** + subtítulo, **preview card** centrada (cover 160×112 + nombre + creador) y todos los campos dentro de un **panel de metadata** grande (`.meta-panel`) con acciones abajo a la derecha: **Cancelar** (borde rojo) y **Enviar/Guardar cambios** (borde blanco) — sin botón "Volver" (Cancelar hace de volver). Campos: nombre, descripción, categoría (reutiliza `CATEGORIES` exportado de `AddLocalMod.jsx`), portada (URL o archivo local vía `read_file_as_data_url` + `CustomFileDialog`), ruta del ejecutable (explorador), versión, archivo `.ini` de stats, tags (CSV), visibilidad inicial. Crear genera código inicial (`generateCodeMaxUses: 100`).
  - **Detalle**: editar / botón "Testear" **deshabilitado "Próximamente (F3)"**, secciones de **Visibilidad** (POST `/visibility`), **Códigos** (lista con usos restantes + copiar + generar con usos máximos) y **Testers** (chips quitar + select de miembros activados para asignar).
  - Endpoints gestión en `creatorRoutes.js`: `POST /creator/projects`, `PATCH /:id`, `POST /:id/visibility`, `POST /:id/codes` (genera `PCN-XXXXXXXX`), `POST /:id/testers` (add/remove, valida `activated`); respuestas `{project}` o `{code}`; errores como códigos (`missing_fields`, `not_activated`, `invalid_max_uses`, etc.) mapeados a español en `API_ERRORS` de `Creator.jsx`.
  - Smoke test OK (login, list, create, patch, visibility, codes, testers add/remove, validaciones 400/404).
- [x] **Form Nuevo Mod v2**: campos de **Lanzamiento** (radios "Lanzar hoy" / "Fecha programada" + datetime-local; si programada → radios "Mostrar badge de cuenta regresiva" / "Conteo silencioso"), **Descripción en Markdown** con botón "Vista previa" (render con `marked` + sanitizado con `dompurify`, instalados en la raíz) y preview MD también en el detalle, sección **Detalles** (créditos, enlaces uno por línea, requisitos, changelog, idioma), sección **Assets** (filas banner/icon/logo/imagen Library/hover image/hover music con input URL + Examinar + ✕ y thumb de preview, trailer URL, galería de screenshots con thumbnails y quitar), **campo visibilidad eliminado del form** (el backend fuerza `visibility: 'hidden'` al crear; la visibilidad se gestiona desde el detalle). Pendiente: **"Publicar como"** (selector nombre propio vs grupo) cuando existan grupos de desarrollo.
  - **Mejoras v2.1**: **Idiomas como chips + select de API** (`GET /api/languages` → lista curada de 48 idiomas ordenados; el usuario **elige de un `<select>`** — sin tipear — y se agrega como chip con ✕ para quitar; dedupe case-insensitive en frontend y backend, modelo array). **Screenshots con orden por arrastre** (reordenamiento en vivo con HTML5 drag + índice numérico) y **nombre/descripción opcionales por imagen** (clic en la miniatura abre editor debajo; modelo `{src, name, description}`, strings legacy se normalizan). **CustomFileDialog con routing**: la **barra de direcciones es editable** (Enter navega a la ruta escrita, `addressDraft` + `navigateTo` devuelve boolean) y el campo de nombre también acepta rutas con Enter (directorio → navega; archivo con extensión → lo selecciona). **Medidas recomendadas como hint** en cada asset y campo: portada/imagen Library/hover = **440×640** (card 220×320 @2x, ratio 11:16), banner Store = **1920×480**, icono = **512×512 PNG con alfa**, logo ModPlay = PNG con alfa ancho ≥1920 px (escala hasta 3528×1197), hover music = MP3/OGG 30–60 s ≤3 MB, screenshots = **1920×1080 (16:9)**.
- [x] **Descargas retail/updates** (ver Decisiones): dos tipos de link por mod (principal + update delta), badge de update en LibraryCard, UI de update en ModPlayView (**"Descarga Principal" eliminada de la vista del jugador**) y grupo "Descargas" en el form PCN.
- [ ] **F3**: módulo de testeo (validar estructura/ini, lanzar, logs).
- [ ] **ModView "Media"**: renombrar pestaña Videos → Media, separar imágenes/videos, campos opcionales nombre/desc por media.
- [ ] **Vista Grupos de desarrollo**: aún sin diseñar (placeholder en `Creator.jsx`, `view === "groups"`); crear/unirse/invitar.
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
