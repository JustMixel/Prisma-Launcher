# Ideas del Prisma Launcher

Registro de ideas y decisiones de diseño pendientes de implementar.

## Iconos estilo escritorio para mods instalados

### Idea general
- Al iniciar la aplicación, mostrar accesos directos de **32x32 px** para los mods instalados recientemente.
- La vista debe comportarse como un pequeño escritorio dentro del launcher.
- Cada acceso directo representa un `LibraryItem`, no directamente un `Mod` del catálogo.

### Interacciones
- **Hover sobre el icono:**
  - El fondo del área principal cambia por una imagen predeterminada del mod.
  - Se reproduce una música predeterminada del mod.
  - Si no hay fondo/música asignada, se usa el fondo base y silencio.
- **Click izquierdo:**
  - Ejecuta el mod.
- **Click derecho:**
  - Abre un menú contextual.
  - Por ahora solo se reserva el espacio; no se detallan sus acciones.

### Origen de los datos
- El catálogo lo entrega la API Node.
- `LibraryItem` se genera localmente en Rust/Tauri.
- `LibraryItem` no se envía desde la API Node.

### Responsabilidades

#### API Node
- `Mod`: datos básicos del mod.
- `ModVersion`: versionado, changelog, checksum, URL de descarga y configuración de lanzamiento.
- `Producer`: productor/creador.
- `Devgroup`: estudio o grupo desarrollador.
- `Assets`: portada, icono 32x32, fondo hover, música hover y logos.

La respuesta de catálogo debe tener:

- `items`: mods de la página, con IDs.
- `includes`: diccionarios de producers, devgroups, versions y assets.
- `meta`: cursor, ETag y `updatedAt`.

#### Rust/Tauri
- Crea y persiste `LibraryItem`.
- Resuelve los IDs del catálogo usando el snapshot local.
- Guarda el estado de instalación.
- Guarda posición y visibilidad del shortcut.
- Ejecuta el mod con comandos Tauri.
- Valida rutas y argumentos antes de ejecutar.

### Campos previstos en `LibraryItem`
- `id`
- `user_id`, si llega a existir cuenta.
- `mod_id`
- `acquired_at`
- `source`
- `license_status`
- `install_status`
- `install_path`
- `installed_version_id`
- `installed_at`
- `last_played_at`
- `play_count`
- `shortcut_visible`
- `shortcut_x`
- `shortcut_y`
- `shortcut_label`
- `cached_snapshot`
- `synced_at`
- `hover_music_override`
- `hover_background_override`
- `shortcut_icon_override`
- `context_menu_id`

### Flujo de instalación
1. El usuario instala un mod.
2. Rust valida que la instalación terminó correctamente.
3. Si no existe `LibraryItem`, se crea.
4. Se llena el estado de instalación.
5. Se activa el shortcut.
6. El mod queda disponible en Library para siempre, salvo revocación de licencia.

### Flujo de desinstalación
1. Se elimina la instalación local.
2. Se oculta o limpia el shortcut.
3. Se conserva `LibraryItem`.
4. Si el mod se reinstala, se reutiliza la misma entrada.

### Decisiones
- Un solo `LibraryItem` unificado: propiedad + instalación + shortcut + caché.
- No separar `InstalledMod` ni `DesktopShortcut` por ahora.
- Usar IDs como contrato entre API y cliente.
- Resolver nombres y assets en `includes` o en caché local.
- Usar caché para funcionar sin conexión.
- El historial completo de versiones se consulta aparte.
- Los listados deben ser paginados por cursor.
- La UI debe renderizar solo los iconos visibles si hay muchos mods.

### Pendiente
- Definir el esquema local de Rust para `LibraryItem`.
- Definir comandos Tauri: obtener Library, instalar, ejecutar, desinstalar y mover shortcut.
- Definir la cuadrícula del escritorio y el tamaño real de los slots.
- Implementar hover con fondo y audio.
- Definir el menú contextual mínimo.
- Definir dónde se guardarán los assets descargados.
- Definir la estrategia de caché y sincronización incremental.

## Plantilla actual de la API

En `server/Routes/launcherRoutes.js` ya existe una plantilla mock con:

- `/api/catalog`: contrato nuevo con `items`, `includes` y `meta`.
- `/api/mods`: respuesta legacy para no romper el frontend actual.
- `/api/mods/:id`: detalle de un mod.
- `/api/mods/:id/versions`: historial de versiones.

## Vista de detalle de un mod (ModView)

### Estado
- **Implementada** en `src/components/ModView.jsx` y `src/components/ModView.module.css`.
- Mock de referencia: `Mock/Main Screens/ModView_Screen.png` (ya revisado).
- Preferencia del usuario: explicar qué hacer y por dónde empezar; entregar código solo cuando pida explícitamente que se implemente.

### Layout del mock
- Columna izquierda (~72%):
  - Banner del cover con botón `←` arriba a la izquierda.
  - Banda gris con `Mod title` y `(Development year)`.
  - Zona scrolleable con tabs `Info | Videos | Updates | Reviews`.
- Columna derecha (~28%, altura completa): logo circular del studio y su nombre.

### Mapeo de datos
- Banner: `m_cover` (fallback `modRender.png`).
- Título: `m_name`; año: `m_releasedate` → `.getFullYear()`.
- Logo circular: `m_devgrouplogo` (fallback `default-studio-logo.svg` con `onError`).
- Nombre dev: `m_devgroupname`.
- Tab `Info`: `m_desc`, `m_downloads`, `m_ratingAverage`, `m_ratingCount`, `m_releasedate`, `m_producername`.
- Tab `Updates`: fetch a `/api/mods/:id/versions` → `version`, `changelog`, `released_at`.
- Tabs `Videos` y `Reviews`: placeholders vacíos.

### Integración
- `Store.jsx` tiene estado `selectedMod`; si existe renderiza `<ModView>` en vez de la grilla/header.
- `Card.jsx` recibe prop `onClick` y lo aplica al div raíz.
- Botón `←` en `ModView` ejecuta `onBack` → `setSelectedMod(null)`.

### Pendiente
- Videos: subir/almacenar material promocional (requiere modelado de datos previo).
- Reviews: sistema de valoraciones de usuarios (requiere modelado de datos previo).
- Descarga real de archivos (el registro en `assets` y la ejecución ya están implementados).
- Consumir `/api/mods/:id` (detalle completo) en vez del objeto legacy de la grilla.
- Ajustes finos de espaciado/colores contra el mock una vez visto en pantalla.
