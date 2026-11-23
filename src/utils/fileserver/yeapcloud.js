// Cliente de la API de Yeap Cloud (console) para el Storage Manager.
// Base: https://api.yeap.cloud (token Bearer; ver note.md / carta de autorización)
// Endpoints extraídos del bundle del console (Fase 1 de investigación).

const BASE = "https://api.yeap.cloud";
const S3_BASE = "/api/user/s3";

// El console manda un X-Device-Id; lo generamos igual para parecer al cliente real
function deviceId()
{
    let id = null;
    try {
        id = localStorage.getItem("yeap-device-id");
        if (!id) {
            id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            localStorage.setItem("yeap-device-id", id);
        }
    } catch {
        id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    return id;
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
        "X-Device-Id": deviceId()
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
        throw error;
    }
    return data;
}

// ---------- Auth ----------

// Registra la cuenta. Devuelve { success, verificationSent }
export async function registerAccount({ email, password })
{
    const data = await request("/auth/register", {
        method: "POST",
        body: { email, password }
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
export async function login({ username, password, cfkey = "" })
{
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
