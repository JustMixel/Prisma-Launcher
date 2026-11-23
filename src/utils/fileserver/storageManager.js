// Storage Manager: orquesta el alta de la cuenta de fileServer y la subida de paquetes.
//
// Flujo completo (Fase 3):
//   Mail.tm (buzón) → Yeap /auth/register → correo de verificación → /auth/verify-email
//   → /auth/login → bucket "modsforme" → access key → credenciales cifradas en Tauri
//   → subida del .zip/.rar por S3 (SigV4) → URL pública para el mod.json
//
// Autorización del uso de Mail.tm con Yeap Cloud: prompt_requests/note.md (Igor Gadovich).

import { invoke } from "@tauri-apps/api/core";
import {
    createMailbox,
    getToken,
    waitForVerificationMessage
} from "./mailtm.js";
import {
    registerAccount,
    verifyEmail,
    login,
    listBuckets,
    createBucket,
    listRegions,
    listAccessKeys,
    createAccessKey,
    extractVerifyToken
} from "./yeapcloud.js";
import {
    getLocalFileSize,
    readLocalChunk,
    putObject,
    objectExists,
    createMultipartUpload,
    uploadPart,
    completeMultipartUpload,
    abortMultipartUpload,
    objectKeyToUrl
} from "./s3.js";

const SECRET_KEY = "fileserver";
const BUCKET_NAME = "modsforme";
const PREFERRED_REGION = "slc1";
const PART_SIZE = 8 * 1024 * 1024; // 8 MiB
const SINGLE_PUT_LIMIT = PART_SIZE;
// Límite operativo del bucket (de 10 GB): no subir más de esto.
const OPERATIONAL_LIMIT = 9.5 * 1024 * 1024 * 1024;

const DEFAULT_CONFIG = {
    endpoint: "https://slc1.s3.yeapcloud.com",
    region: PREFERRED_REGION,
    bucket: BUCKET_NAME
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

// Configuración mínima para hablar con S3 (no requiere cuenta nueva)
export function storageConfig(credentials = null)
{
    return {
        ...DEFAULT_CONFIG,
        ...(credentials || {}),
        accessKeyId: credentials?.accessKeyId || "",
        secretAccessKey: credentials?.secretAccessKey || ""
    };
}

// ---------- Altas y consultas de la cuenta ----------

function randomPassword()
{
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    let out = "Px";
    for (const byte of bytes) {
        out += alphabet[byte % alphabet.length];
    }
    return `${out}-7!`;
}

function fail(message, step)
{
    const error = new Error(message);
    error.step = step;
    throw error;
}

/**
 * Da de alta la cuenta completa en Yeap Cloud con temp-mail de Mail.tm.
 * onStep(texto) recibe el avance de cada etapa para mostrarlo en la UI.
 */
export async function provisionAccount({ onStep = () => {} } = {})
{
    // 1. Buzón temporal
    onStep("Creando buzón temporal en Mail.tm...");
    const mailbox = await createMailbox("prisma");
    const mailToken = await getToken(mailbox);

    // 2. Registro en Yeap Cloud
    onStep("Creando la cuenta en Yeap Cloud...");
    const yeapPassword = randomPassword();
    let registration;
    try {
        registration = await registerAccount({ email: mailbox.address, password: yeapPassword });
    } catch (error) {
        if (/captcha|required|verify|human/i.test(String(error.message))) {
            fail(
                `Yeap pidió verificación humana en el registro (${error.message}). ` +
                "Completá esa verificación una vez en https://console.yeap.cloud/register y reintentá.",
                "registro"
            );
        }
        fail(`No se pudo registrar en Yeap Cloud: ${error.message}`, "registro");
    }

    // 3. Correo de verificación
    if (registration.verificationSent) {
        onStep("Esperando el correo de verificación...");
        const message = await waitForVerificationMessage(mailToken);
        const link = requireVerificationLink(message);
        const verifyToken = extractVerifyToken(link);
        if (!verifyToken) {
            fail("El correo de verificación no traía un token reconocible.", "verificacion");
        }

        onStep("Confirmando el correo...");
        try {
            await verifyEmail(verifyToken);
        } catch (error) {
            if (!/already|expir|used/i.test(String(error.message))) {
                fallBackVerify(error);
            }
        }
    }

    // 4. Login
    onStep("Iniciando sesión en Yeap Cloud...");
    let session;
    try {
        session = await login({ username: mailbox.address, password: yeapPassword });
    } catch (error) {
        if (error.requires2fa) {
            fail("La cuenta pidió 2FA; creala/manualizá una vez desde el console y reintentá.", "login");
        }
        fail(`No se pudo iniciar sesión en Yeap Cloud: ${error.message}`, "login");
    }

    // 5. Bucket
    onStep("Preparando el bucket de almacenamiento...");
    const token = session.token;
    const buckets = await listBuckets(token);
    let bucket = buckets.find((entry) => String(entry.name || entry.bucket || "").toLowerCase() === BUCKET_NAME);

    if (!bucket) {
        const regions = await listRegions(token);
        const preferred = regions.find((entry) => String(entry.name || entry.id || entry.region || "") === PREFERRED_REGION)
            || regions[0];
        const regionId = preferred
            ? String(preferred.id || preferred.name || preferred.region || PREFERRED_REGION)
            : PREFERRED_REGION;

        try {
            bucket = await createBucket(token, { regionId, name: BUCKET_NAME });
        } catch (error) {
            if (!/exist|already|409/i.test(String(error.message))) {
                fail(`No se pudo crear el bucket "${BUCKET_NAME}": ${error.message}`, "bucket");
            }
            bucket = (await listBuckets(token)).find(
                (entry) => String(entry.name || entry.bucket || "").toLowerCase() === BUCKET_NAME
            );
        }
    }

    // 6. Access key (el secreto suele mostrarse solo una vez: lo capturamos acá)
    onStep("Generando credenciales de acceso...");
    const keys = await listAccessKeys(token);
    let accessKey = keys.find((entry) => /prisma/i.test(String(entry.name || entry.id || "")));
    let secretAccessKey = "";
    let manualKeyNeeded = false;

    if (!accessKey) {
        const created = await createAccessKey(token, { name: "prisma-launcher", permission: "readwrite" });
        accessKey = created;
        secretAccessKey =
            created?.secret_access_key ||
            created?.secretKey ||
            created?.secret ||
            "";
        if (!secretAccessKey) {
            manualKeyNeeded = true;
        }
    } else {
        manualKeyNeeded = true;
    }

    const credentials = {
        ...DEFAULT_CONFIG,
        accessKeyId: accessKey ? createdKeyId(accessKey) : "",
        secretAccessKey,
        yeapToken: token,
        mailbox: mailbox.address,
        manualKeyNeeded,
        createdAt: new Date().toISOString()
    };

    onStep("Guardando credenciales cifradas...");
    await saveCredentials(credentials);

    if (manualKeyNeeded) {
        const error = new Error(
            accessKey
                ? `Ya existe la access key "${accessKey.name || accessKey.id}". Copiá su secreto desde el console (Object Storage → Access keys) y pegalo para terminar.`
                : "Yeap creó la access key pero no devolvió el secreto. Copialo desde el console y pegalo para terminar."
        );
        error.step = "access-key";
        error.manualKey = true;
        error.credentials = credentials;
        throw error;
    }

    onStep("Cuenta de fileServer lista.");
    return credentials;
}

/** Guarda a mano las credenciales S3 copiadas desde el console de Yeap. */
export async function saveManualCredentials({ accessKeyId, secretAccessKey })
{
    const current = (await loadCredentials()) || { ...DEFAULT_CONFIG, mailbox: null };
    const credentials = {
        ...current,
        accessKeyId: String(accessKeyId || "").trim(),
        secretAccessKey: String(secretAccessKey || "").trim(),
        manualKeyNeeded: false,
        createdAt: current.createdAt || new Date().toISOString()
    };
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error("Faltan la Access Key o la Secret Key.");
    }
    await saveCredentials(credentials);
    return credentials;
}

function createdKeyId(accessKey)
{
    return String(
        accessKey.access_key_id ||
        accessKey.accessKeyId ||
        accessKey.id ||
        accessKey.key ||
        ""
    );
}

function requireVerificationLink(message)
{
    const content = [message.html, message.text].flat().filter(Boolean).join("\n");
    const urls = content.match(/https?:\/\/[^\s"'<>\\)]+/g) || [];
    const link = urls.find((url) => /yeap\.cloud/i.test(url) && /verif/i.test(url));
    if (!link) {
        fail("No llegó el correo de verificación de Yeap Cloud.", "verificacion");
    }
    return link.replace(/&amp;/g, "&");
}

function fallBackVerify(error)
{
    fail(`No se pudo confirmar el correo: ${error.message}`, "verificacion");
}

// ---------- Espacio y subida ----------

// Consulta el uso real del bucket en el console (best effort: si falla, se usa
// el contador local y el corte duro de 9.5 GB).
async function fetchUsedBytes(credentials)
{
    if (!credentials.yeapToken) {
        return Number(credentials.usedBytes || 0);
    }
    try {
        const response = await fetch("https://api.yeap.cloud/api/user/s3/usage", {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${credentials.yeapToken}`,
                "X-Device-Id": localStorage.getItem("yeap-device-id") || "prisma-launcher"
            }
        });
        if (!response.ok) {
            return Number(credentials.usedBytes || 0);
        }
        const data = await response.json();
        const value =
            data?.bytes ??
            data?.data?.bytes ??
            data?.used ??
            data?.data?.used ??
            null;
        return value === null ? Number(credentials.usedBytes || 0) : Number(value);
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
            `El bucket está en el límite operativo (9.5 GB de 10 GB). ` +
            `Esta subida lo llevaría a ${(projected / (1024 ** 3)).toFixed(2)} GB.`,
            "espacio"
        );
    }
}

/**
 * Sube un archivo local al bucket y devuelve la URL pública.
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
        fail("No hay credenciales de fileServer. Creá la cuenta primero.", "credenciales");
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
    await saveCredentials(credentials);
    onStep(`Paquete subido: ${url}`);
    return url;
}

/** Verifica que una URL del bucket responda (para confirmar lectura pública). */
export async function verifyPublicUrl(url)
{
    try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok;
    } catch {
        return false;
    }
}
