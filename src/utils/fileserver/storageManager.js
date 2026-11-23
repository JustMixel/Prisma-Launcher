// Storage Manager: credenciales de Tigris y subida de paquetes del mod.
//
// Tigris es S3-compatible (endpoint https://t3.storage.dev, región "auto").
// La cuenta se crea fuera del launcher (requiere MFA y, para buckets públicos,
// verificación de método de pago). Acá sólo guardamos las access keys en
// Stronghold y subimos el .zip/.rar con SigV4.
//
// Límite operativo: 4.5 GB de los 5 GB gratuitos del plan free.

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
const PROVIDER = "tigris";
const ENDPOINT = "https://t3.storage.dev";
const REGION = "auto";
const DEFAULT_BUCKET = "prisma-mods";
const PUBLIC_DOMAIN = "t3.tigrisbucket.io";
const PART_SIZE = 8 * 1024 * 1024; // 8 MiB
const SINGLE_PUT_LIMIT = PART_SIZE;
const OPERATIONAL_LIMIT = 4.5 * 1024 * 1024 * 1024; // 4.5 GB

const DEFAULT_CONFIG = {
    provider: PROVIDER,
    endpoint: ENDPOINT,
    region: REGION,
    bucket: DEFAULT_BUCKET,
    publicBase: `https://${DEFAULT_BUCKET}.${PUBLIC_DOMAIN}`
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
    const cleaned = String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-") // Tigris no admite puntos en buckets públicos
        .replace(/^-+|-+$/g, "")
        .slice(0, 63)
        .replace(/-+$/g, "");
    return cleaned || DEFAULT_BUCKET;
}

function publicBaseFor(bucket)
{
    return `https://${bucket}.${PUBLIC_DOMAIN}`;
}

/** Configura el cliente S3. Sólo el bucket y las keys vienen del cofre. */
export function storageConfig(credentials = null)
{
    const bucket = sanitizeBucket(credentials?.bucket);
    return {
        ...DEFAULT_CONFIG,
        bucket,
        publicBase: credentials?.publicBase || publicBaseFor(bucket),
        accessKeyId: credentials?.accessKeyId || "",
        secretAccessKey: credentials?.secretAccessKey || ""
    };
}

// ---------- Conexión manual (Tigris no permite alta automática) ----------

function fail(message, step)
{
    const error = new Error(message);
    error.step = step;
    throw error;
}

/**
 * Guarda las access keys creadas en el console de Tigris.
 * Access Key ID:   tid_...
 * Secret Key:      tsec_...
 */
export async function saveManualCredentials({ accessKeyId, secretAccessKey, bucket })
{
    const id = String(accessKeyId || "").trim();
    const secret = String(secretAccessKey || "").trim();
    const safeBucket = sanitizeBucket(bucket);

    if (!id || !secret) {
        fail("Faltan la Access Key o la Secret Key.", "credenciales");
    }
    if (!id.startsWith("tid_") || !secret.startsWith("tsec_")) {
        fail(
            "Las claves parecen incorrectas: en Tigris la Access Key empieza con «tid_» " +
            "y la Secret Key con «tsec_». Copialas desde Console → Access keys.",
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

async function ensureSpace(credentials, bytes)
{
    const used = await fetchUsedBytes(credentials);
    const projected = used + bytes;
    if (projected > OPERATIONAL_LIMIT) {
        fail(
            `El bucket está en el límite operativo (4.5 GB de 5 GB). ` +
            `Esta subida lo llevaría a ${(projected / (1024 ** 3)).toFixed(2)} GB.`,
            "espacio"
        );
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
        fail("No hay credenciales de Tigris. Pegá las access keys del console.", "credenciales");
    }

    const config = storageConfig(credentials);
    const fileName = String(localPath).split(/[\\/]/).pop() || "paquete.zip";
    const objectKey = key || `mods/${Date.now()}-${fileName.replace(/[^\w.\-]+/g, "_")}`;

    onStep("Leyendo el archivo local...");
    const total = await getLocalFileSize(localPath);
    if (!total) {
        fail("El archivo está vacío.", "lectura");
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
