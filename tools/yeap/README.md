# tools/yeap

Automatización de la migración a Yeap Cloud. Sacado de la sesión original y versionado acá para que sobreviva a la compactación de contexto.

## Scripts

| Archivo | Qué hace |
|---|---|
| `solve-and-register7.mjs` | Flujo principal: resuelve el captcha de Captchala con Playwright + Edge del sistema, y registra la cuenta en Yeap. Incluye reintento de arrastre que verifica movimiento antes del drag completo. |
| `register-probe.mjs` | Prueba el endpoint de registro y reporta el código de error (430 captcha, 400 email desechable, 200 ok). |
| `provision-test.mjs` | Provisión posterior al registro: login, bucket público, access keys, CORS, cuota. |
| `mf_client.mjs` | Cliente mínimo para la Console API de Yeap. |
| `tm-org-probe.mjs` | Sonda a la API de temp-mail.org: creación de buzón y lectura de mensajes. |
| `apply_stronghold.mjs` | Guarda las credenciales en Tauri Stronghold. |
| `analyze-canvas.js` | Análisis de la imagen del captcha: localiza el hueco. |
| `hole-profile.js` | Perfil de color del borde del hueco, para el matching. |

## Uso

```powershell
cd tools/yeap
npm install
node solve-and-register7.mjs "usuario@dominio.com"
```

Requiere Edge instalado y WARP conectado con el split tunnel configurado (ver `HANDOFF.md`).

## Estado

El captcha funciona: 3/3 verificaciones con `pass_token`. El bloqueo actual es el email — Yeap rechaza dominios desechables. Detalle completo en `HANDOFF.md`, sección 5.
