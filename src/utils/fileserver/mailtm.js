// Cliente de Mail.tm: buzones temporales para verificar cuentas en Yeap Cloud.
// API libre (sin key, 8 QPS por IP). Documentación: https://docs.mail.tm

const BASE = "https://api.mail.tm";

// Listas esperadas de campos (el servidor responde con hydra:member o member)
function listOf(data)
{
    if (Array.isArray(data)) {
        return data;
    }
    return data?.["hydra:member"] || data?.member || [];
}

async function request(path, { method = "GET", body = null, token = null } = {})
{
    const headers = { Accept: "application/json" };
    if (body) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(BASE + path, {
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

    if (!response.ok) {
        const message = (data && (data.detail || data.message)) || `Mail.tm HTTP ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }
    return data;
}

// Dominios activos disponibles para crear buzones
async function listDomains()
{
    const data = await request("/domains");
    return listOf(data)
        .filter((entry) => entry.isActive && !entry.isPrivate)
        .map((entry) => entry.domain);
}

// Crea un buzón temporal. Devuelve { address, password }
async function createMailbox(prefix = "prisma")
{
    const domains = await listDomains();
    if (domains.length === 0) {
        throw new Error("Mail.tm no tiene dominios disponibles.");
    }

    const suffix = String(Date.now()).slice(-6) + Math.floor(Math.random() * 90 + 10);
    const address = `${prefix}${suffix}@${domains[0]}`;
    const password = `Prisma-${suffix}-Tm!`;

    await request("/accounts", { method: "POST", body: { address, password } });
    return { address, password };
}

// Token de acceso del buzón (Bearer)
async function getToken({ address, password })
{
    const data = await request("/token", { method: "POST", body: { address, password } });
    if (!data?.token) {
        throw new Error("Mail.tm no devolvió token.");
    }
    return data.token;
}

async function listMessages(token)
{
    const data = await request("/messages", { token });
    return listOf(data);
}

async function getMessage(token, id)
{
    return request(`/messages/${id}`, { token });
}

// Extrae el enlace de verificación de Yeap Cloud de un mensaje (HTML o texto)
export function extractVerificationLink(message)
{
    const content = [message.html, message.text]
        .flat()
        .filter(Boolean)
        .join("\n");

    const urls = content.match(/https?:\/\/[^\s"'<>\\)]+/g) || [];
    const candidate = urls.find((url) => /yeap\.cloud/i.test(url) && /verif/i.test(url));
    return candidate ? candidate.replace(/&amp;/g, "&") : null;
}

// Espera el correo de verificación de Yeap (polling controlado)
export async function waitForVerificationMessage(token, { timeoutMs = 90000, intervalMs = 4000 } = {})
{
    const deadline = Date.now() + timeoutMs;
    let attempts = 0;

    while (Date.now() < deadline) {
        attempts += 1;
        const messages = await listMessages(token);
        const match = messages.find((entry) =>
            /yeap/i.test(String(entry.from?.address || entry.from?.name || "")) ||
            /verif/i.test(String(entry.subject || ""))
        );

        if (match) {
            return getMessage(token, match.id);
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`No llegó el correo de verificación de Yeap tras ${attempts} intentos.`);
}

export { listDomains, createMailbox, getToken, listMessages, getMessage };
