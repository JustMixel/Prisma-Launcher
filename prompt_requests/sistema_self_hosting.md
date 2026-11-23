# Integración de Mail.tm y Yeap Cloud en Prisma Launcher — Investigación e implementación

## Objetivo principal

Investiga e implementa una integración entre Mail.tm y Yeap Cloud para el sistema Storage Manager de Prisma Launcher.

El objetivo es automatizar los procesos de correo electrónico, verificación, configuración y administración del almacenamiento, de forma modular, segura y eficiente.

Antes de modificar el proyecto, inspecciona su arquitectura actual, identifica los componentes existentes y determina cómo integrar esta funcionalidad sin romper el funcionamiento actual.

## 1. Investigación de las APIs

### Mail.tm

Documentación:
https://docs.mail.tm/

Investiga y documenta:

- API REST y endpoints disponibles.
- Consulta de dominios disponibles.
- Creación de buzones.
- Autenticación y obtención de tokens.
- Consulta de mensajes recibidos.
- Lectura de mensajes HTML y texto.
- Extracción segura de enlaces de verificación.
- Manejo de errores, expiración y disponibilidad del buzón.
- Posibilidad de utilizar Server-Sent Events para detectar mensajes nuevos.

Todos los dominios temporales son aceptados por Yeap Cloud.

### Yeap Cloud

Documentación:
https://yeap.cloud/docs/

Investiga especialmente:

- Registro y autenticación.
- Requisitos de verificación de correo.
- Compatibilidad con dominios temporales.
- Creación y administración de buckets.
- Generación de Access Key ID y Secret Access Key.
- API compatible con Amazon S3.
- Autenticación AWS Signature Version 4.
- URLs públicas y URLs prefirmadas.
- Subidas normales y multipart.
- Descargas directas mediante CDN.
- Consulta de almacenamiento y transferencia consumidos.
- Límites gratuitos y condiciones de facturación.

Configuración inicial conocida:

| Parámetro | Valor |
|---|---|
| Proveedor | Yeap Cloud |
| Endpoint S3 | https://slc1.s3.yeapcloud.com |
| Región | slc1 |
| Bucket de prueba | modsforme |
| Autenticación | AWS Signature V4 |

Verifica que estos valores continúen siendo válidos antes de utilizarlos.

## 2. Flujo de correo y verificación

Implementa un módulo independiente para gestionar la comunicación con Mail.tm.

Debe contemplar:

1. Consultar los dominios disponibles.
2. Crear un buzón de prueba cuando corresponda.
3. Obtener y gestionar las credenciales de acceso al buzón.
4. Detectar mensajes de verificación de Yeap Cloud.
5. Identificar el remitente y validar el contenido del mensaje.
6. Extraer el enlace de verificación.
7. Validar que el enlace pertenece al dominio legítimo de Yeap Cloud.
8. Completar la verificación cuando el flujo esté autorizado.
9. Registrar el resultado sin almacenar información sensible innecesaria.

No abrir automáticamente enlaces arbitrarios recibidos por correo.

Implementa límites de tiempo, reintentos controlados, cancelación y manejo de errores.

## 3. Integración S3

Implementa un adaptador independiente para Yeap Cloud.

Debe permitir:

- Verificar la conexión.
- Listar objetos.
- Consultar metadatos.
- Subir archivos.
- Descargar archivos.
- Eliminar objetos.
- Obtener URLs de descarga (preferiblemente permanentes).
- Gestionar errores de autenticación.
- Reanudar o gestionar subidas multipart cuando sea posible.

Utiliza AWS SDK o una biblioteca S3 compatible y evita implementar manualmente la firma criptográfica si existe una biblioteca mantenida.

No guardes Access Key ni Secret Key dentro del código fuente, archivos públicos o ejecutables distribuidos.

## 4. Sistema de almacenamiento

Integra Yeap Cloud con el Storage Manager existente.

Implementa:

- Identificación individual de cada cuenta y bucket.
- Seguimiento del espacio utilizado.
- Seguimiento de las transferencias.
- Disponibilidad y estado de cada proveedor.
- Distribución de archivos.
- Recuperación ante fallos.
- Registro de operaciones.
- Detección de archivos duplicados mediante SHA-256.
- Verificación de integridad después de las transferencias.

### Reglas de negocio

Establece un límite operativo de 9.5 GB de almacenamiento por bucket de 10 GB.

Antes de subir un archivo:

1. Consultar el espacio disponible.
2. Comprobar el tamaño del archivo.
3. Reservar espacio para las operaciones concurrentes.
4. Rechazar la operación si supera el límite.
5. Liberar la reserva si la subida falla; eliminar el archivo incompleto.

No confundas almacenamiento con transferencia: son cuotas independientes.

El sistema debe registrar el consumo de transferencia y advertir cuando se aproxime a los límites gratuitos.

No presupongas que el contador interno puede impedir el consumo generado por descargas directas desde el CDN.

## 5. Seguridad

Aplica las siguientes medidas:

- Almacenamiento seguro de credenciales.
- Cifrado de secretos en reposo.
- No exponer credenciales S3 al frontend.
- Permisos mínimos necesarios para cada clave.
- Validación de certificados TLS.
- Protección contra SSRF.
- Validación de dominios y enlaces de verificación.
- Protección contra path traversal.
- Validación de nombres y extensiones.
- Límites de tamaño.
- Verificación SHA-256.
- Control de concurrencia.
- Logs sin tokens ni secretos.
- Protección contra solicitudes repetidas.
- Manejo seguro de errores.

No desactives controles de seguridad para facilitar la integración.

## 6. Arquitectura

Mantén los módulos desacoplados:

- MailProvider: interfaz para proveedores de correo.
- MailTmAdapter: implementación específica de Mail.tm.
- StorageProvider: interfaz de almacenamiento.
- YeapCloudAdapter: implementación S3.
- AccountManager: administración de credenciales y cuentas autorizadas.
- StorageManager: distribución y seguimiento del almacenamiento.
- IntegrityService: validación SHA-256.
- TransferMonitor: seguimiento de transferencias.
- SecurityService: protección de secretos y validación de operaciones.

Adapta estos nombres a las convenciones existentes del proyecto en lugar de duplicar componentes que ya existan.

## 7. Pruebas obligatorias

Crea pruebas automatizadas para:

- Conexión con Mail.tm.
- Creación y autenticación de buzones.
- Recepción de mensajes.
- Identificación de mensajes de verificación.
- Validación de enlaces.
- Conexión con Yeap Cloud.
- Autenticación S3.
- Creación y consulta de objetos.
- Subida y descarga de ZIP.
- Comparación SHA-256.
- Gestión de errores.
- Límites de almacenamiento.
- Operaciones concurrentes.
- Recuperación ante interrupciones.

Distingue claramente las pruebas simuladas de las pruebas reales contra los servicios.

No declares que una prueba real ha sido superada si no se ha ejecutado.

## 8. Entregables

Al finalizar, proporciona:

1. Diagnóstico de la arquitectura existente.
2. Documentación de las APIs utilizadas.
3. Archivos nuevos y modificados.
4. Explicación de la integración.
5. Configuración necesaria.
6. Instrucciones de ejecución.
7. Resultados de las pruebas.
8. Riesgos y limitaciones pendientes.
9. Recomendaciones para integrar el sistema en producción.

## Restricciones

- No introducir dependencias innecesarias.
- No modificar funcionalidades ajenas a esta integración.
- No inventar endpoints ni capacidades.
- No asumir que una URL compartida temporal es equivalente a una URL pública permanente.
- No asumir que las cuotas de almacenamiento y transferencia son intercambiables.
- No realizar operaciones de registro o verificación sin autorización.
- Mantener compatibilidad con la arquitectura actual de Prisma Launcher.

**Prioridad:** primero investigar y validar técnicamente Mail.tm y Yeap Cloud; después implementar los adaptadores y finalmente integrar el sistema completo.

No comiences con una refactorización general. Trabaja incrementalmente y documenta cada decisión técnica.