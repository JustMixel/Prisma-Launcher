// Storage Manager: credenciales de Backblaze B2 y subida de paquetes del mod.
//
// B2 es S3-compatible (endpoint https://s3.us-west-004.backblazeb2.com,
// región us-west-004). La cuenta y el bucket se crean fuera del launcher;
// acá sólo guardamos la keyID / applicationKey en Stronghold y subimos el
// .zip/.rar con SigV4.
//
// Límite duro del usuario: 10 GB por archivo y 10 GB en total en el bucket.

import { invoke } from "@tauri-apps/api/core";
import {
    getLocalFileSize,
    readLocalChunk,
    putObject,
    objectExists,
    createMultipartUpload,
    uploadPart,
    completeMultipartUpload,
    abortMultipartUpload,
    objectKeyToUrl,
    getBucketUsage
} from "./s3.js";

const SECRET_KEY = "fileserver";
const PROVIDER = "backblaze-b2";
const ENDPOINT = "https://s3.us-west-004.backblazeb2.com";
const REGION = "us-west-004";
const DEFAULT_BUCKET = "prisma-mods";
const PART_SIZE = 8 * 1024 * 1024; // 8 MiB (B2 pide >= 5 MiB por parte)
const SINGLE_PUT_LIMIT = PART_SIZE;
const OPERATIONAL_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB (tope duro)
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // Ningún archivo puede superar 10 GB, nunca.

const DEFAULT_CONFIG = {
    provider: PROVIDER,
    endpoint: ENDPOINT,
    region: REGION,
    bucket: DEFAULT_BUCKET
};

// ---------- Almacenamiento cifrado de credenciales ----------

export async function loadCredentials()
{
    try {
        const raw = await invoke("load_secret", { key: SECRET_KEY });
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export async function saveCredentials(credentials)
{
    await invoke("save_secret", { key: SECRET_KEY, value: JSON.stringify(credentials) });
}

export async function clearCredentials()
{
    await invoke("delete_secret", { key: SECRET_KEY });
}

function sanitizeBucket(value)
{
    // B2: 3-63 caracteres, minúsculas, dígitos y guiones; nombre globalmente único.
    const cleaned = String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 63)
        .replace(/-+$/g, "");
    return cleaned.length >= 3 ? cleaned : DEFAULT_BUCKET;
}

function publicBaseFor(bucket)
{
    // Bucket público de B2 sirve las claves por host virtual.
    return `https://${bucket}.s3.${REGION}.backblazeb2.com`;
}

/** Configura el cliente S3. Sólo el bucket y las keys vienen del cofre. */
export function storageConfig(credentials = null)
{
    const bucket = sanitizeBucket(credentials?.bucket);
    return {
        ...DEFAULT_CONFIG,
        bucket,
        publicBase: credentials?.publicBase || publicBaseFor(bucket),
        accessKeyId: credentials?.accessKeyId || "", // B2 keyID
        secretAccessKey: credentials?.secretAccessKey || "" // B2 applicationKey
    };
}

// ---------- Conexión manual (la cuenta y las keys se crean en el dashboard de B2) ----------

function fail(message, step)
{
    const error = new Error(message);
    error.step = step;
    throw error;
}

/**
 * Guarda la application key creada en B2 (Capabilities: readObjects + writeObjects,
 * limitada al bucket elegido).
 */
export async function saveManualCredentials({ accessKeyId, secretAccessKey, bucket })
{
    const id = String(accessKeyId || "").trim();
    const secret = String(secretAccessKey || "").trim();
    const safeBucket = sanitizeBucket(bucket);

    if (!id || !secret) {
        fail("Faltan la keyID o la applicationKey.", "credenciales");
    }
    if (id.startsWith("tid_") || secret.startsWith("tsec_")) {
        fail(
            "Esas claves son de Tigris. En Backblaze B2 usá la keyID y la applicationKey " +
            "de Application Keys en el dashboard.",
            "credenciales"
        );
    }

    const previous = (await loadCredentials()) || {};
    const sameBucket = previous.bucket === safeBucket;
    const credentials = {
        ...DEFAULT_CONFIG,
        bucket: safeBucket,
        publicBase: publicBaseFor(safeBucket),
        accessKeyId: id,
        secretAccessKey: secret,
        usedBytes: sameBucket ? Number(previous.usedBytes || 0) : 0,
        objectCount: sameBucket ? Number(previous.objectCount || 0) : 0,
        createdAt: previous.createdAt || new Date().toISOString()
    };

    await saveCredentials(credentials);
    return credentials;
}

// ---------- Espacio y subida ----------

/** Consulta el uso real del bucket. Si falla, devuelve el último valor local. */
export async function checkStorageUsage()
{
    const credentials = await loadCredentials();
    if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
        return null;
    }

    const config = storageConfig(credentials);
    try {
        const usage = await getBucketUsage(config);
        credentials.usedBytes = usage.bytes;
        credentials.objectCount = usage.objects;
        await saveCredentials(credentials);
        return { ...usage, limit: OPERATIONAL_LIMIT };
    } catch (error) {
        return {
            bytes: Number(credentials.usedBytes || 0),
            objects: Number(credentials.objectCount || 0),
            limit: OPERATIONAL_LIMIT,
            error: error.message
        };
    }
}

async function fetchUsedBytes(credentials)
{
    try {
        const usage = await getBucketUsage(storageConfig(credentials));
        credentials.usedBytes = usage.bytes;
        credentials.objectCount = usage.objects;
        return usage.bytes;
    } catch {
        return Number(credentials.usedBytes || 0);
    }
}

/**
 * Regla central de tamaño. Se exporta para poder probarla sin Tauri.
 * - Ningún archivo individual puede superar 10 GB, nunca.
 * - El total del bucket tampoco puede superar 10 GB.
 */
export function checkUploadSize(fileBytes, usedBytes = 0)
{
    if (!Number.isFinite(fileBytes) || fileBytes <= 0) {
        return { ok: false, reason: "empty" };
    }
    if (fileBytes > MAX_FILE_SIZE) {
        return { ok: false, reason: "file", fileBytes, limit: MAX_FILE_SIZE };
    }
    if (Number(usedBytes) + fileBytes > OPERATIONAL_LIMIT) {
        return { ok: false, reason: "bucket", fileBytes, usedBytes: Number(usedBytes), limit: OPERATIONAL_LIMIT };
    }
    return { ok: true, fileBytes, usedBytes: Number(usedBytes), limit: OPERATIONAL_LIMIT };
}

function failSize(check)
{
    if (check.reason === "file") {
        fail(
            `El archivo pesa ${(check.fileBytes / (1024 ** 3)).toFixed(2)} GB y supera el límite duro de 10 GB. ` +
            "No se va a subir bajo ningún concepto.",
            "tamaño"
        );
    }
    fail(
        `El bucket alcanzaría ${((check.usedBytes + check.fileBytes) / (1024 ** 3)).toFixed(2)} GB y superaría el tope de 10 GB. ` +
        `Espacio usado actualmente: ${(check.usedBytes / (1024 ** 3)).toFixed(2)} GB.`,
        "espacio"
    );
}

async function ensureSpace(credentials, bytes)
{
    const used = await fetchUsedBytes(credentials);
    const check = checkUploadSize(bytes, used);
    if (!check.ok) {
        failSize(check);
    }
}

/**
 * Sube un archivo local al bucket y devuelve su URL pública.
 *
 * @param {string} localPath ruta del .zip/.rar
 * @param {object} options
 * @param {string} [options.key]        clave S3 (si no: mods/<fecha>-<nombre>)
 * @param {string} [options.contentType]
 * @param {(percent:number, sent:number, total:number)=>void} [options.onProgress]
 * @param {(step:string)=>void} [options.onStep]
 */
export async function uploadPackage(localPath, {
    key = null,
    contentType = "application/zip",
    onProgress = () => {},
    onStep = () => {}
} = {})
{
    const credentials = await loadCredentials();
    if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
        fail("No hay credenciales de Backblaze B2. Pegá la keyID y la applicationKey del dashboard.", "credenciales");
    }

    const config = storageConfig(credentials);
    const fileName = String(localPath).split(/[\\/]/).pop() || "paquete.zip";
    const objectKey = key || `mods/${Date.now()}-${fileName.replace(/[^\w.\-]+/g, "_")}`;

    onStep("Leyendo el archivo local...");
    const total = await getLocalFileSize(localPath);
    if (!total) {
        fail("El archivo está vacío.", "lectura");
    }
    // Regla absoluta: se rechaza antes de leer/subir cualquier byte.
    const earlyCheck = checkUploadSize(total, credentials.usedBytes || 0);
    if (!earlyCheck.ok && earlyCheck.reason === "file") {
        failSize(earlyCheck);
    }
    await ensureSpace(credentials, total);

    if (await objectExists(config, objectKey)) {
        fail(`Ya existe un archivo con esa clave en el bucket (${objectKey}).`, "duplicado");
    }

    let url;

    if (total <= SINGLE_PUT_LIMIT) {
        onStep("Subiendo paquete...");
        const bytes = await readLocalChunk(localPath, 0, total);
        await putObject(config, objectKey, bytes, contentType);
        onProgress(100, total, total);
        url = objectKeyToUrl(config, objectKey);
    } else {
        onStep("Subiendo paquete (multipart)...");
        const uploadId = await createMultipartUpload(config, objectKey, contentType);
        const parts = [];
        const partCount = Math.ceil(total / PART_SIZE);

        try {
            for (let index = 0; index < partCount; index += 1) {
                const offset = index * PART_SIZE;
                const length = Math.min(PART_SIZE, total - offset);
                const bytes = await readLocalChunk(localPath, offset, length);
                const part = await uploadPart(config, objectKey, uploadId, index + 1, bytes);
                parts.push(part);

                const sent = Math.min(offset + length, total);
                onProgress(Math.round((sent / total) * 100), sent, total);
            }

            onStep("Finalizando subida...");
            url = await completeMultipartUpload(config, objectKey, uploadId, parts);
        } catch (error) {
            onStep("La subida falló; cancelando partes...");
            await abortMultipartUpload(config, objectKey, uploadId);
            throw error;
        }
    }

    credentials.usedBytes = Number(credentials.usedBytes || 0) + total;
    credentials.objectCount = Number(credentials.objectCount || 0) + 1;
    await saveCredentials(credentials);
    onStep(`Paquete subido: ${url}`);
    return url;
}

/** Verifica que una URL pública responda (para confirmar lectura pública). */
export async function verifyPublicUrl(url)
{
    try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok;
    } catch {
        return false;
    }
}
