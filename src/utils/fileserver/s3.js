// Cliente S3 genérico (Yeap Cloud: https://slc1.s3.yeapcloud.com, región slc1).
// Firma AWS Signature V4 usando WebCrypto (HMAC-SHA256), sin dependencias externas.
// Los Access/Secret Key NUNCA se escriben en logs ni viajan por el frontend más allá
// de cada petición firmada; se cargan desde el almacén cifrado de Tauri.

import { invoke } from "@tauri-apps/api/core";

const ALGORITHM = "AWS4-HMAC-SHA256";
const UNSIGNED = "UNSIGNED-PAYLOAD";

function toBytes(value)
{
    return new TextEncoder().encode(value);
}

function toHex(bytes)
{
    let out = "";
    for (const byte of bytes) {
        out += byte.toString(16).padStart(2, "0");
    }
    return out;
}

function base64ToBytes(base64)
{
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}

async function hmac(key, data)
{
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, data));
}

async function sha256Hex(data)
{
    if (!crypto.subtle) {
        return null;
    }
    const digest = await crypto.subtle.digest("SHA-256", data);
    return toHex(new Uint8Array(digest));
}

// Codificación RFC 3986 (la que exige SigV4)
function encodeUri(value, encodeSlash = true)
{
    return encodeURIComponent(value)
        .replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
        .replace(/%2F/g, encodeSlash ? "%2F" : "/");
}

function timestampNow()
{
    const now = new Date();
    const date = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    return { dateStamp: date.slice(0, 8), amzDate: date };
}

/**
 * Firma una petición S3 con SigV4 y devuelve { url, headers } listos para fetch.
 *
 * @param {object} options
 * @param {string} options.method      HTTP method (GET, PUT, POST, DELETE, HEAD)
 * @param {string} options.endpoint    https://slc1.s3.yeapcloud.com
 * @param {string} options.bucket      prisma-mods
 * @param {string} [options.key]       clave del objeto (sin bucket)
 * @param {Record<string,string>} [options.query]
 * @param {Record<string,string>} [options.headers]  cabeceras extra (content-type, etc.)
 * @param {Uint8Array|string|null} [options.body]
 * @param {string} options.region      slc1
 * @param {string} options.accessKeyId
 * @param {string} options.secretAccessKey
 */
export async function signRequest({
    method = "GET",
    endpoint,
    bucket,
    key = "",
    query = {},
    headers = {},
    body = null,
    region,
    accessKeyId,
    secretAccessKey,
    virtualHost = false,
    timestamp = null
})
{
    const base = endpoint.replace(/\/+$/, "");
    const baseUrl = new URL(base);
    const authority = virtualHost ? `${bucket}.${baseUrl.host}` : baseUrl.host;

    const url = new URL(`${base}${virtualHost ? "" : `/${bucket}`}${key ? `/${encodeUri(key)}` : ""}`);
    url.host = authority;

    Object.entries(query).forEach(([name, value]) => {
        url.searchParams.set(name, value);
    });

    const { dateStamp, amzDate } = timestamp
        ? {
            dateStamp: timestamp.slice(0, 8),
            amzDate: timestamp
        }
        : timestampNow();

    // Sin cuerpo: hash del payload vacío (lo que espera S3 en GET/HEAD).
    // Con cuerpo: hash real; si WebCrypto no está disponible se usa UNSIGNED-PAYLOAD.
    const emptyHash = await sha256Hex(new Uint8Array(0));
    let payloadHash = emptyHash || UNSIGNED;
    if (body !== null && body !== undefined && (typeof body !== "object" || body.length)) {
        const bytes = typeof body === "string" ? toBytes(body) : body;
        payloadHash = (await sha256Hex(bytes)) || UNSIGNED;
    }

    const host = url.host;
    const allHeaders = {
        host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        ...Object.fromEntries(
            Object.entries(headers)
                .filter(([, value]) => value !== undefined && value !== null && value !== "")
                .map(([name, value]) => [name.toLowerCase(), String(value).trim()])
        )
    };

    // Si el llamador fijó X-Amz-Content-Sha256, ese es el valor que va en la firma.
    const signedPayloadHash = allHeaders["x-amz-content-sha256"];

    const signedHeaderNames = Object.keys(allHeaders).sort();
    const canonicalHeaders = signedHeaderNames
        .map((name) => `${name}:${allHeaders[name]}\n`)
        .join("");

    // Query string canonica: nombres y valores ordenados y codificados RFC3986
    const canonicalQuery = [...url.searchParams.entries()]
        .map(([name, value]) => [encodeUri(name), encodeUri(value)])
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0))
        .map(([name, value]) => `${name}=${value}`)
        .join("&");

    const canonicalUri = url.pathname
        .split("/")
        .map((segment) => encodeUri(decodeURIComponent(segment)))
        .join("/");

    const canonicalRequest = [
        method.toUpperCase(),
        canonicalUri || "/",
        canonicalQuery,
        canonicalHeaders,
        signedHeaderNames.join(";"),
        signedPayloadHash
    ].join("\n");

    const scope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = [
        ALGORITHM,
        amzDate,
        scope,
        await sha256Hex(toBytes(canonicalRequest))
    ].join("\n");

    const dateKey = await hmac(toBytes(`AWS4${secretAccessKey}`), toBytes(dateStamp));
    const regionKey = await hmac(dateKey, toBytes(region));
    const serviceKey = await hmac(regionKey, toBytes("s3"));
    const signingKey = await hmac(serviceKey, toBytes("aws4_request"));
    const signature = toHex(await hmac(signingKey, toBytes(stringToSign)));

    allHeaders.Authorization = `${ALGORITHM} Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames.join(";")}, Signature=${signature}`;

    return { url: url.toString(), headers: allHeaders };
}

function raiseHttpError(status, text)
{
    const message = (text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
    const error = new Error(message || `S3 respondió HTTP ${status}`);
    error.status = status;
    throw error;
}

async function s3Fetch(config, options)
{
    const signed = await signRequest({ ...config, ...options });
    const response = await fetch(signed.url, {
        method: options.method || "GET",
        headers: signed.headers,
        body: options.body && options.body.length ? options.body : undefined
    });

    if (!response.ok) {
        raiseHttpError(response.status, await response.text());
    }
    return response;
}

/** Devuelve true si el objeto existe (HEAD). */
export async function objectExists(config, key)
{
    try {
        await s3Fetch(config, { method: "HEAD", key });
        return true;
    } catch (error) {
        if (error.status === 404) {
            return false;
        }
        throw error;
    }
}

/** Sube un buffer completo en una sola petición PUT. */
export async function putObject(config, key, bytes, contentType = "application/octet-stream")
{
    await s3Fetch(config, {
        method: "PUT",
        key,
        headers: { "content-type": contentType },
        body: bytes
    });
    return objectKeyToUrl(config, key);
}

export function objectKeyToUrl(config, key)
{
    // Los buckets públicos se sirven desde el host virtual del bucket, no desde
    // el endpoint firmado. Si el proveedor define publicBase, lo usamos.
    if (config.publicBase) {
        return `${config.publicBase.replace(/\/+$/, "")}/${encodeUri(key, false)}`;
    }
    return `${config.endpoint.replace(/\/+$/, "")}/${config.bucket}/${encodeUri(key)}`;
}

/** Suma el tamaño de todos los objetos del bucket usando ListObjectsV2. */
export async function getBucketUsage(config)
{
    let continuationToken = "";
    let bytes = 0;
    let objects = 0;

    do {
        const query = { "list-type": "2", "max-keys": "1000" };
        if (continuationToken) {
            query["continuation-token"] = continuationToken;
        }
        const response = await s3Fetch(config, { method: "GET", query });
        const xml = await response.text();

        for (const match of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
            bytes += Number(parseTag(match[1], "Size") || 0);
            objects += 1;
        }

        const truncated = parseTag(xml, "IsTruncated") === "true";
        continuationToken = truncated ? parseTag(xml, "NextContinuationToken") || "" : "";
        if (truncated && !continuationToken) {
            break;
        }
    } while (continuationToken);

    return { bytes, objects };
}

// ---------- Multipart (archivos grandes) ----------

function xmlTag(name, value)
{
    return `<${name}>${String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")}</${name}>`;
}

async function requestXml(config, options, bodyText)
{
    const response = await s3Fetch(config, {
        ...options,
        headers: {
            "content-type": "application/xml",
            ...(options.headers || {})
        },
        body: bodyText
    });
    return response.text();
}

function parseTag(xml, tag)
{
    const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return match ? match[1] : null;
}

export async function createMultipartUpload(config, key, contentType)
{
    const xml = await requestXml(
        config,
        { method: "POST", key, query: { uploads: "" } },
        `<?xml version="1.0" encoding="UTF-8"?><InitiateMultipartUploadResult><Bucket>${config.bucket}</Bucket><Key>${key}</Key><ContentType>${contentType}</ContentType></InitiateMultipartUploadResult>`
    );
    const uploadId = parseTag(xml, "UploadId");
    if (!uploadId) {
        throw new Error("S3 no devolvió un UploadId.");
    }
    return uploadId;
}

export async function uploadPart(config, key, uploadId, partNumber, bytes)
{
    const response = await s3Fetch(config, {
        method: "PUT",
        key,
        query: { partNumber: String(partNumber), uploadId },
        body: bytes
    });
    const etag = response.headers.get("etag");
    if (!etag) {
        throw new Error(`La parte ${partNumber} no devolvió ETag.`);
    }
    return { partNumber, etag };
}

export async function completeMultipartUpload(config, key, uploadId, parts)
{
    const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
    const body =
        `<?xml version="1.0" encoding="UTF-8"?><CompleteMultipartUpload>` +
        sorted.map((part) => `<Part><PartNumber>${part.partNumber}</PartNumber><ETag>${part.etag}</ETag></Part>`).join("") +
        `</CompleteMultipartUpload>`;

    const xml = await requestXml(
        config,
        { method: "POST", key, query: { uploadId } },
        body
    );

    if (xml.includes("<Error>")) {
        throw new Error(parseTag(xml, "Message") || "Fallo al completar la subida multipart.");
    }
    return objectKeyToUrl(config, key);
}

export async function abortMultipartUpload(config, key, uploadId)
{
    try {
        await s3Fetch(config, { method: "DELETE", key, query: { uploadId } });
    } catch {
        // mejor esfuerzo: no romper el flujo por un aborto fallido
    }
}

// ---------- Lectura de archivos locales por chunks ----------

export async function getLocalFileSize(path)
{
    return Number(await invoke("get_file_size", { path }));
}

export async function readLocalChunk(path, offset, length)
{
    const base64 = await invoke("read_file_chunk", { path, offset, length });
    return base64ToBytes(base64);
}
