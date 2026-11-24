# HANDOFF — Prisma Launcher / migración a Yeap Cloud

> Documento de reanudación. Si eres el agente que acaba de abrir esta sesión:
> lee esto completo antes de responder. Reemplaza el historial compactado.

---

## 1. Tu rol

Eres el programador. killywilly **no** escribe código, **no** ejecuta comandos y **no** prueba nada por ti.

- Lees el repo, entiendes el estado, editas archivos, ejecutas comandos, verificas.
- killywilly da dirección y decide. Nada más.
- Nunca le entregues código para que lo pegue. Si hay que crear un archivo, lo creas tú con la herramienta de escritura.
- Si algo falla, lo diagnosticas tú. No le pides que revise la consola ni que te pegue errores que puedes obtener solo.
- Trabajas en español.

Idioma de código, nombres y commits: el del repo (español en UI, inglés en símbolos).

---

## 2. El proyecto

**Prisma Launcher** — launcher de escritorio para StoryLines/Prisma Studios.
Tauri v2 + React. Rust en `src-tauri/`, frontend en `src/`.

Ruta:

```
E:\Archivos Erick\StoryLines\Launcher\Prisma Studios Launcher\Tauri-Version\Prisma Launcher
```

Rama activa: `dev`. Último commit confirmado antes de este tramo: `0900859`.
Este tramo dejó cambios sin commitear; ver sección 9.

Comandos de verificación obligatorios:

| Cambio | Verificación |
|---|---|
| Frontend | `npm run build` |
| Rust | `cargo check` y luego `cargo build` |
| SigV4 / tamaños | `npm test` |

Última corrida: las cuatro pasaron. `cargo build` emite solo warnings `LNK4099` por PDB de `libsodium_sys`; no afectan el binario.

---

## 3. Objetivo en curso

Migrar el servidor de archivos de **Backblaze B2** a **Yeap Cloud**:

```
registro de cuenta → bucket público → access keys → subida de mods
```

Restricciones duras:

1. **Credenciales solo en Tauri Stronghold** (`fileserver`). Nunca en chat, código ni frontend. `secrets.json` es solo fuente de migración.
2. **Tope de 10 GB** (plan free de Yeap) y **10 GB máximo por archivo**. Rechazo antes de subir.
3. Bucket **público** para URLs permanentes. Presigned links máximo 7 días.
4. **El captcha se resuelve 100 % automático.** Prohibido involucrar al humano, navegador visible o copia manual de tokens.
5. **WARP debe seguir conectado.** Es lo que permite operar sin límites. No desconectarlo.
6. Reutilizar `s3.js` (SigV4/multipart/ListObjectsV2) y `storageManager.js`. Usar la Console API de Yeap.

---

## 4. Lo que ya está hecho

### Investigación y red

- **Causa del HTTP 430 identificada**: egress de WARP marcado. Se aplicó split tunnel en modo excluir; `api.ipify.org` salió por IP real `148.101.157.243` y Cloudflare sigue reportando `warp=on`.
- **Captcha drag resuelto 3/3**: la verificación devuelve `{"ok":true,"pass_token":"pt_…","ttl":300}`. Registro con `X-Captcha-Id: pt_…` deja de dar 430.
- **API real de correo temporal confirmada**: `temp-mail.org`, no Mail.tm.
  - `POST https://web2.temp-mail.org/mailbox` → `token` JWT + `mailbox`.
  - `GET https://web2.temp-mail.org/messages` con `Authorization: Bearer <token>` → `{"mailbox":"…","messages":[]}`.
  - Dominios devueltos: `forims.com`, `anonmart.com`, `dvdee.com`.
- Descartados: `api.temp-mail.org`, Mail.tm, `tempmail.lol`, `inboxes.com`, `example.com`, `temp-mail.io`.
- Con captcha válido, Yeap rechaza correos desechables con `400 Disposable email addresses cannot be used to sign up. Please use a permanent email address`. Falta verificar el correo de confirmación real de Yeap en esta API.
- Tor instalado; `curl 8.13.0` disponible.

### Código adaptado a Yeap

- `src/utils/fileserver/storageManager.js`
  - `PROVIDER = "yeap-cloud"`, `ENDPOINT = "https://slc1.s3.yeapcloud.com"`, `REGION = "slc1"`.
  - `saveManualCredentials({ accessKeyId, secretAccessKey, bucket, publicBase })` guarda también `publicBase`, `consoleToken` y `account`.
  - `normalizePublicBase()` acepta `public_url` de la Console y cae a `https://<bucket>.slc1.s3.yeapcloud.com`.
  - `checkUploadSize()` mantiene 10 GB por archivo y 10 GB totales; rechaza antes de leer/subir bytes.
- `src/utils/fileserver/s3.js`
  - Comentarios y ejemplos alineados a endpoint/región Yeap.
  - SigV4, PUT simple, multipart, `ListObjectsV2` y `objectKeyToUrl()` reutilizados sin cambios funcionales.
- `src/utils/fileserver/yeapcloud.js`
  - Endpoints reales: `/api/user/s3/overview`, `/buckets`, `/buckets/{id}`, `/buckets/{id}/public`, `/buckets/{id}/quota`, `/buckets/{id}/cors`, `/keys`.
  - Headers de captcha: `X-Captcha-Id`, `X-Captcha-Answer`, `X-Captcha-Type`.
  - Payloads reales: `{ region_id, name }`, `{ enabled:true }`, `{ quota_gb:10 }`, `{ rules:[…] }`, `{ name, permission:"readwrite", scope:"buckets", bucket_ids:[id] }`.
  - `request()` desenvuelve `{ success:true, data:… }`, detecta `success:false` y marca `captchaRequired`.
- `src/components/Creator.jsx`
  - UI del File Server migrada a Yeap Cloud.
  - Estado `fsPublicBase` cableado a carga y guardado de credenciales.
  - `fsConnected` exige `provider === "yeap-cloud"`.
  - Campo opcional «URL base pública» y texto de alto con Console, bucket público, cuota, CORS y access key.
- `src/components/Creator.module.css`: comentario de la sección actualizado.
- `src/utils/session.js`: restaurado a `getSession`/`saveSession`/`clearSession`. La versión anterior cambiada a `yc_token` rompía los imports de `Creator.jsx`.
- `src-tauri/src/lib.rs`: módulo F3 de testeo (validar, lanzar, logs en vivo y detener proceso) sigue en el mismo conjunto de cambios.

### Verificación

- `npm test` ✅ (vectores SigV4 + 6 casos de tamaño).
- `npm run build` ✅ (Vite 7.3.7, 93 módulos).
- `cargo check --manifest-path src-tauri\Cargo.toml` ✅.
- `cargo build --manifest-path src-tauri\Cargo.toml` ✅ (solo warnings de PDB de libsodium).

---

## 5. Bloqueos abiertos

1. **No hay cuenta Yeap aprobada ni credenciales en mano.** No existen:
   - `C:\Users\PC Gamer\AppData\Local\Temp\opencode\yeap-test-creds.json`
   - `%APPDATA%\.prisma\secrets.json`
   - `%APPDATA%\.prisma\vault.stronghold`
2. No se crearon bucket público, cuota 10 GB, CORS, access key ni subida real.
3. **Captcha click mode sin solver headless verificado.** Modo detectado: `display_type:"click"`, `dot_count:3`, `image_url`, `thumb_url`, `si.s`, `si.c:5`, `si.r:4`, `pow`, `challenge_id`. No hay respuesta de verificación resuelta para puntos/coordenadas.
4. `web2.temp-mail.org` responde `Access-Control-Allow-Origin: https://temp-mail.org`. `fetch` directo desde el webview de Tauri no sirve sin puente permitido. El proxy Rust/Cargo se añadió y se revirtió; `src-tauri/Cargo.toml` y `http_request` quedaron limpios.
5. No se verificó aún el formato del correo de verificación de Yeap en `web2.temp-mail.org`.
6. Base de datos real del launcher inexistente; Store sigue con mocks.
7. `tempMailRegister.ts` es un intento descartado con endpoints imaginarios. No commitear.

---

## 6. Próximo paso

1. Si aparece una cuenta aprobada con claves en archivo local, guardarlas en Stronghold bajo `fileserver` y correr provisión con `yeapcloud.js`: bucket `slc1`, público, cuota 10 GB, CORS, access key limitada al bucket.
2. Probar `uploadPackage()` con un `.zip` real y confirmar `HEAD` a la URL pública con `verifyPublicUrl()`.
3. Para el registro automático: cerrar el captcha click headless y montar un puente Tauri para `web2.temp-mail.org` sin navegador visible. No preguntar al humano.
4. Limpiar hosts temporales del split tunnel: `api.ipify.org`, `api.mail.tm`, `mail.tm`, `captcha.la`, `api.captcha.la`, `temp-mail.org`, `api.temp-mail.org`, `www.temp-mail.org` y cualquier host nuevo usado en las sondas.
5. Commitear y hacer push a `dev` con el estado verificado de esta sección.

---

## 7. Archivos relevantes

| Archivo | Estado |
|---|---|
| `src/utils/fileserver/storageManager.js` | adaptado a Yeap; límites 10 GB intactos |
| `src/utils/fileserver/s3.js` | reutilizado; comentarios Yeap |
| `src/utils/fileserver/yeapcloud.js` | endpoints y headers reales; sin probar en vivo |
| `src/components/Creator.jsx` | UI Yeap + `fsPublicBase` cableado |
| `src/components/Creator.module.css` | estilos File Server y módulo F3 |
| `src-tauri/src/lib.rs` | Stronghold + comandos F3, sin proxy |
| `src/utils/session.js` | restaurado |
| `tests/sigv4.test.mjs` | regresión SigV4 y reglas de tamaño |
| `tools/yeap/README.md` | inventario de scripts de migración |
| `HANDOFF.md` | este documento |
| `CONTEXT.md` | sección File Server actualizada a Yeap |
| `tempMailRegister.ts` | descartado, sin trackear; no commitear |
| `AGENTS.md` | archivo local del entorno; no commitear |

---

## 8. Trampas conocidas

- No desconectar WARP. Rompe el acceso.
- No pedir al humano que resuelva el captcha. Es requisito explícito.
- No pegar credenciales en el chat. Van a Stronghold o a un archivo local.
- `warp-cli` está en `C:\Program Files\Cloudflare\Cloudflare WARP\warp-cli.exe`; el split tunnel es modo excluir.
- La rotación de WARP del guard no afecta el tráfico de Yeap una vez excluido.
- Solver drag: la pieza no se movía (`moved=0, scale=0`). Ya se corrigió con bucle que verifica movimiento antes del arrastre completo.
- El bundle del console de Yeap está en `F:\Games\Zelda Remake\Triforce\Temp\yeap-user-bundle.js`.
- La copia de la sesión original está en `docs/ai/session-export.md`; contiene el historial previo a esta compactación.

---

## 9. Cómo reanudar

Al abrir la sesión nueva:

1. Lee este archivo.
2. Corre `git status` y `git diff --stat` en el repo.
3. Di en 10 líneas el estado real y el próximo paso concreto.
4. Empieza a ejecutar. Sin pedir permiso para lo que ya está decidido.
