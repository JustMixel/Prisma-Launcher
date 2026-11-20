# Fase 1: Servidor Básico - Instrucciones

## Objetivo
Crear un servidor Node.js que escuche peticiones y se conecte a SQL Server local.

---

## Paso 1: Verificar instalaciones necesarias

Antes de tocar código, asegúrate de tener:

- [ ] **Node.js** instalado (verificar con `node --version` en terminal)
- [ ] **SQL Server Express** instalado (motor de base de datos)
- [ ] **SQL Server Management Studio (SSMS)** instalado (para gestionar la BD)

Si no tienes SQL Server y SSMS:
1. Busca "SQL Server Express download" en Google
2. Descarga e instala SQL Server Express (edición gratuita)
3. Durante la instalación, elige autenticación mixta y recuerda la contraseña del usuario `sa`
4. Descarga e instala SQL Server Management Studio (SSMS)

---

## Paso 2: Crear estructura de carpetas

En la raíz del proyecto (`Prisma Launcher/`), crear una carpeta `server/`:

```
Prisma Launcher/
├── src/
├── src-tauri/
├── server/          ← NUEVA CARPETA
├── package.json
├── ...
```

---

## Paso 3: Inicializar proyecto Node

Abrir terminal **dentro de la carpeta `server/`** y ejecutar:

```bash
npm init -y
```

Esto genera un `package.json` básico para el servidor.

---

## Paso 4: Instalar dependencias

En la misma terminal, dentro de `server/`:

```bash
npm install express mssql cors
```

| Paquete | Para qué sirve |
|---------|----------------|
| `express` | Framework web para crear servidor y endpoints |
| `mssql` | Driver para conectar Node.js con SQL Server |
| `cors` | Permite que el frontend (launcher) haga peticiones al servidor |

---

## Paso 5: Crear `index.js`

Crear archivo `server/index.js` con 3 objetivos en orden:

### 5a) Importar librerías
Usar `require()` para importar express, mssql y cors.

### 5b) Servidor Express básico
- Crear instancia de Express
- Definir puerto de escucha (ej: `3000`)
- Crear ruta GET `/` que responda un mensaje de prueba
- Iniciar el servidor y mostrar mensaje en consola al escuchar

### 5c) Conectar a SQL Server
Configurar y probar conexión a la base de datos con estos datos:

```javascript
const config = {
    server: "localhost",        // o ".\\SQLEXPRESS" según tu instancia
    database: "master",         // base de datos del sistema (por ahora)
    user: "sa",                 // usuario administrador
    password: "TU_CONTRASEÑA",  // la que configuraste al instalar
    options: {
        encrypt: false,         // para SQL Server local
        trustServerCertificate: true
    }
};
```

**Alternativa con autenticación de Windows** (si usas Windows Auth):
```javascript
const config = {
    server: "localhost",
    database: "master",
    options: {
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: true
    }
};
```

---

## Paso 6: Probar el servidor

En la terminal (dentro de `server/`):

```bash
node index.js
```

**Resultado esperado:** Mensaje en consola tipo "Servidor corriendo en puerto 3000"

**Probar en navegador:** Abrir `http://localhost:3000` y ver la respuesta

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| Error de conexión a SQL Server | Verificar que el servicio SQL Server esté ejecutándose (services.msc) |
| Error de autenticación | Revisar usuario/contraseña en SSMS primero |
| Puerto ocupado | Cambiar el número de puerto en el código |
| `mssql` no conecta | Verificar nombre de instancia en SQL Server Configuration Manager |

---

## Siguiente paso (Fase 2)

Una vez el servidor responda correctamente, crear la base de datos y tablas:
- Tabla `mods` (id, name, description, category, version, file_path, etc.)
- Tabla `ratings` (id, mod_id, user_id, score)
- Tabla `users` (id, username, password_hash, created_at)
