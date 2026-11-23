// Cliente de la API de Yeap Cloud (console) para el Storage Manager.
// Base: https://api.yeap.cloud (token Bearer; ver note.md / carta de autorización)
// Endpoints extraídos del bundle del console (Fase 1 de investigación).

const BASE = "https://api.yeap.cloud";
const S3_BASE = "/api/user/s3";

// El console genera un "device id" de 64 hex (yc_did) con canvas/WebGL/audio
// y lo manda como X-Device-Id y como cfkey en auth/login. Lo replicamos en el
// webview de Tauri para que la API vea el mismo tipo de valor.
let deviceIdPromise = null;

function fnv1a(value)
{
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
}

async function computeDeviceId()
{
    const parts = [];

    try {
        const canvas = document.createElement("canvas");
        canvas.width = 240;
        canvas.height = 60;
        const context = canvas.getContext("2d");
        if (context) {
            context.textBaseline = "top";
            context.font = "14px Arial";
            context.fillStyle = "#f60";
            context.fillRect(100, 1, 62, 20);
            context.fillStyle = "#069";
            context.fillText("Yeap Cloud, 😀 0123", 2, 15);
            parts.push(canvas.toDataURL());
        }
    } catch {
        // sin canvas: seguimos con el resto de señales
    }

    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
            const info = gl.getExtension("WEBGL_debug_renderer_info");
            parts.push(
                String(info ? gl.getParameter(info.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)),
                String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
            );
        }
    } catch {
        // WebGL opcional
    }

    const navigatorRef = typeof navigator !== "undefined" ? navigator : {};
    const screenRef = typeof screen !== "undefined" ? screen : {};

    parts.push(
        String(navigatorRef.userAgent || ""),
        `${screenRef.width || 0}x${screenRef.height || 0}x${screenRef.colorDepth || 0}`,
        String(navigatorRef.language || ""),
        (navigatorRef.languages || []).join(","),
        String(navigatorRef.platform || ""),
        String(navigatorRef.hardwareConcurrency || ""),
        String(navigatorRef.deviceMemory || ""),
        String(navigatorRef.maxTouchPoints || 0),
        String(navigatorRef.vendor || ""),
        Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        String(new Date(2026, 0, 1).getTimezoneOffset())
    );

    const material = parts.join("|");
    if (globalThis.crypto?.subtle) {
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
        return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    // Fallback determinista de 64 hex sin WebCrypto
    return Array.from({ length: 8 }, (_, index) => fnv1a(`${material}::${index}`)).join("");
}

export async function getDeviceId()
{
    let stored = null;
    try {
        stored = localStorage.getItem("yc_did");
    } catch {
        // sin localStorage: calculamos en memoria
    }
    if (stored && /^[a-f0-9]{64}$/.test(stored)) {
        return stored;
    }

    if (!deviceIdPromise) {
        deviceIdPromise = computeDeviceId().then((id) => {
            try {
                localStorage.setItem("yc_did", id);
            } catch {
                // no persistimos si localStorage está bloqueado
            }
            return id;
        });
    }
    return deviceIdPromise;
}

async function request(path, { method = "GET", body = null, token = null, query = null } = {})
{
    let url = BASE + path;
    if (query) {
        const params = new URLSearchParams(query);
        url += `?${params.toString()}`;
    }

    const headers = {
        Accept: "application/json",
        "X-Device-Id": await getDeviceId()
    };
    if (body) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (response.status === 502 || response.status === 503 || response.status === 504) {
        const error = new Error("La API de Yeap Cloud no está disponible ahora mismo (intentá de nuevo).");
        error.status = response.status;
        throw error;
    }

    if (!response.ok) {
        const message = (data && (data.error || data.message || data.detail)) || `Yeap Cloud HTTP ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.payload = data;
        if (data?.captcha_required || /captcha|human check|too many attempts|rate.?limit/i.test(message)) {
            error.captchaRequired = true;
        }
        throw error;
    }

    // La API suele responder HTTP 200 con { success: false, error: "..." }.
    if (data && typeof data === "object" && data.success === false) {
        const message = data.error || data.message || "La operación fue rechazada por Yeap Cloud.";
        const error = new Error(message);
        error.status = response.status;
        error.payload = data;
        if (
            data.captcha_required ||
            data.rate_limited ||
            /captcha|human check|too many attempts|rate.?limit|verify|verification required/i.test(message)
        ) {
            error.captchaRequired = Boolean(data.captcha_required || /captcha|human check/i.test(message));
        }
        throw error;
    }

    return data;
}

// ---------- Auth ----------

// Registra la cuenta. Devuelve { success, verificationSent }
export async function registerAccount({ email, password, username })
{
    const data = await request("/auth/register", {
        method: "POST",
        body: {
            username: username || String(email || "").split("@")[0],
            email,
            password
        }
    });
    return {
        success: data?.success !== false,
        verificationSent: Boolean(data?.verification_sent),
        message: data?.message || ""
    };
}

// Confirma el correo con el token del mensaje de Mail.tm
export async function verifyEmail(token)
{
    const data = await request("/auth/verify-email", {
        method: "POST",
        body: { token }
    });
    return { success: data?.success !== false, message: data?.message || "" };
}

export async function resendVerification(email)
{
    return request("/auth/resend-verification", { method: "POST", body: { email } });
}

// Login. Devuelve { token, refreshToken }
export async function login({ username, password, cfkey = null })
{
    // El console envía cfkey=null en el login normal; el valor sólo se rellena
    // cuando el backend pide verificación humana (rate-limit / captcha_required).
    const data = await request("/auth/login", {
        method: "POST",
        body: { username, password, cfkey, remember: true }
    });
    if (data?.requires_2fa) {
        const error = new Error("La cuenta requiere 2FA; completalo manualmente.");
        error.requires2fa = true;
        error.challengeToken = data.challenge_token;
        throw error;
    }
    if (!data?.token) {
        throw new Error(data?.error || data?.message || "Login fallido en Yeap Cloud.");
    }
    return { token: data.token, refreshToken: data.refresh_token || "" };
}

// ---------- S3 admin (bucket + access keys) ----------

export async function listBuckets(token)
{
    const data = await request(`${S3_BASE}/buckets`, { token });
    return Array.isArray(data) ? data : (data?.items || []);
}

export async function createBucket(token, { regionId, name })
{
    return request(`${S3_BASE}/buckets`, {
        method: "POST",
        token,
        body: { region_id: regionId, name: String(name).toLowerCase() }
    });
}

export async function listRegions(token)
{
    const data = await request(`${S3_BASE}/regions`, { token });
    return Array.isArray(data) ? data : (data?.items || []);
}

export async function listAccessKeys(token)
{
    const data = await request(`${S3_BASE}/keys`, { token });
    return Array.isArray(data) ? data : (data?.items || []);
}

export async function createAccessKey(token, { name, permission = "readwrite" })
{
    return request(`${S3_BASE}/keys`, {
        method: "POST",
        token,
        body: { name, permission }
    });
}

export async function getS3Overview(token)
{
    return request(`${S3_BASE}/overview`, { token });
}

// Extrae el token del enlace de verificación de Yeap
export function extractVerifyToken(link)
{
    if (!link) {
        return null;
    }
    try {
        const url = new URL(link);
        return url.searchParams.get("token") || url.searchParams.get("t") || null;
    } catch {
        const match = String(link).match(/[?&](?:token|t)=([^&]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }
}
