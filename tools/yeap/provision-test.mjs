import crypto from "node:crypto";
import fs from "node:fs";

const MAIL = "https://api.mail.tm";
const YEAP = "https://api.yeap.cloud";
const OUT = "C:\\Users\\PC Gamer\\AppData\\Local\\Temp\\opencode\\yeap-test-creds.json";

const deviceId = crypto.randomBytes(32).toString("hex");
const rand = crypto.randomBytes(4).toString("hex");
const username = `prisma${rand}`;
const password = `Prisma-${crypto.randomBytes(8).toString("hex")}!Aa1`;
const prefix = `prisma${rand}`;

function log(...args) { console.log(...args); }

async function call(url, { method = "GET", body = null, token = null, headers = {} } = {}) {
  const h = { Accept: "application/json", ...headers };
  if (body) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, ok: res.ok, data, text };
}

// Mail.tm devuelve 403 intermitentes desde algunos nodos: reintentar.
async function callRetry(url, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    last = await call(url, options);
    if (last.status !== 403 && last.status !== 429 && last.status < 500) return last;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return last;
}

function listOf(data) {
  if (Array.isArray(data)) return data;
  return data?.["hydra:member"] || data?.member || [];
}

function extractLink(message) {
  const content = [message.html, message.text].flat().filter(Boolean).join("\n");
  const urls = content.match(/https?:\/\/[^\s"'<>\\)]+/g) || [];
  return urls.find((u) => /yeap\.cloud/i.test(u) && /verif/i.test(u)) || urls.find((u) => /yeap\.cloud/i.test(u)) || null;
}

// ---------- Mail.tm ----------
log("1. Mail.tm: dominios");
const domainsRes = await callRetry(`${MAIL}/domains`);
if (!domainsRes.ok) { log("Fallo dominios", domainsRes.status, domainsRes.data); process.exit(1); }
const domains = listOf(domainsRes.data).filter((d) => d.isActive && !d.isPrivate).map((d) => d.domain);
log("   dominios:", domains.slice(0, 5).join(", "));
if (!domains.length) process.exit(1);

const address = `${prefix}@${domains[0]}`;
log("2. Mail.tm: crear buzón", address);
const accountRes = await callRetry(`${MAIL}/accounts`, { method: "POST", body: { address, password } });
log("   status:", accountRes.status, accountRes.ok ? "OK" : accountRes.data);
if (!accountRes.ok) process.exit(1);

const tokenRes = await callRetry(`${MAIL}/token`, { method: "POST", body: { address, password } });
const mailToken = tokenRes.data?.token;
log("   token buzón:", mailToken ? "OK" : tokenRes.data);
if (!mailToken) process.exit(1);

// ---------- Yeap register ----------
log("3. Yeap: registrar", username, address);
const regRes = await call(`${YEAP}/auth/register`, {
  method: "POST",
  headers: { "X-Device-Id": deviceId },
  body: { username, email: address, password }
});
log("   status:", regRes.status, JSON.stringify(regRes.data));

// ---------- Esperar correo ----------
log("4. Esperando correo de verificación...");
let message = null;
const deadline = Date.now() + 90000;
while (Date.now() < deadline) {
  const msgs = await callRetry(`${MAIL}/messages`, { token: mailToken });
  const list = listOf(msgs.data);
  if (list.length) {
    log("   mensajes:", list.map((m) => `${m.from?.address} :: ${m.subject}`).join(" | "));
    const match = list.find((m) => /yeap/i.test(String(m.from?.address || m.from?.name || "")) || /verif/i.test(String(m.subject || "")));
    if (match) {
      const full = await call(`${MAIL}/messages/${match.id}`, { token: mailToken });
      message = full.data;
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 4000));
}
if (!message) { log("   No llegó el correo."); process.exit(1); }

const link = extractLink(message);
log("   link:", link ? link.replace(/token=[^&]+/, "token=***") : "NO ENCONTRADO");
if (!link) {
  log("   HTML:", String(message.html || message.text || "").slice(0, 800));
  process.exit(1);
}

const verifyToken = new URL(link).searchParams.get("token") || new URL(link).searchParams.get("t");
log("   token verificación:", verifyToken ? "OK" : "NO");

// ---------- Verify ----------
log("5. Yeap: verificar email");
const verifyRes = await call(`${YEAP}/auth/verify-email`, {
  method: "POST",
  headers: { "X-Device-Id": deviceId },
  body: { token: verifyToken }
});
log("   status:", verifyRes.status, JSON.stringify(verifyRes.data));

// ---------- Login ----------
log("6. Yeap: login");
const loginRes = await call(`${YEAP}/auth/login`, {
  method: "POST",
  headers: { "X-Device-Id": deviceId },
  body: { username, password, cfkey: null, remember: true }
});
log("   status:", loginRes.status, JSON.stringify(loginRes.data));
const token = loginRes.data?.token;
if (!token) { log("   Sin token; guardo datos de cuenta para reintentar."); fs.writeFileSync(OUT, JSON.stringify({ username, password, address, deviceId }, null, 2)); process.exit(1); }

const auth = { Authorization: `Bearer ${token}`, "X-Device-Id": deviceId };

// ---------- Overview ----------
log("7. S3 overview");
const overviewRes = await call(`${YEAP}/api/user/s3/overview`, { headers: auth });
log("   status:", overviewRes.status, JSON.stringify(overviewRes.data).slice(0, 1200));

// ---------- Crear bucket ----------
const region = overviewRes.data?.data?.regions?.[0] || overviewRes.data?.regions?.[0];
const regionId = region?.id ?? region?.region_id ?? region?.code ?? "slc1";
const bucketName = `prisma-test-${rand}`;
log("8. Crear bucket", bucketName, "region_id:", regionId);
const bucketRes = await call(`${YEAP}/api/user/s3/buckets`, {
  method: "POST",
  headers: auth,
  body: { region_id: regionId, name: bucketName }
});
log("   status:", bucketRes.status, JSON.stringify(bucketRes.data).slice(0, 800));
const bucket = bucketRes.data?.data || bucketRes.data;
if (!bucket?.id) { log("   Sin id de bucket."); process.exit(1); }

// ---------- Público ----------
log("9. Hacer público");
const pubRes = await call(`${YEAP}/api/user/s3/buckets/${bucket.id}/public`, {
  method: "PUT",
  headers: auth,
  body: { enabled: true }
});
log("   status:", pubRes.status, JSON.stringify(pubRes.data));

// ---------- Detalle ----------
const detailRes = await call(`${YEAP}/api/user/s3/buckets/${bucket.id}`, { headers: auth });
log("10. Detalle:", JSON.stringify(detailRes.data).slice(0, 1200));
const detail = detailRes.data?.data || detailRes.data;

// ---------- Quota ----------
const quotaRes = await call(`${YEAP}/api/user/s3/buckets/${bucket.id}/quota`, {
  method: "PUT",
  headers: auth,
  body: { quota_gb: 10 }
});
log("11. Quota:", quotaRes.status, JSON.stringify(quotaRes.data));

// ---------- Access key ----------
log("12. Crear access key");
const keyRes = await call(`${YEAP}/api/user/s3/keys`, {
  method: "POST",
  headers: auth,
  body: { name: `launcher-${rand}`, permission: "readwrite", scope: "buckets", bucket_ids: [bucket.id] }
});
log("   status:", keyRes.status, JSON.stringify(keyRes.data).slice(0, 1200));
const key = keyRes.data?.data || keyRes.data;

const out = {
  username,
  password,
  address,
  deviceId,
  bucketId: bucket.id,
  bucketName: bucket.name || bucketName,
  publicUrl: detail?.public_url || detail?.publicUrl || null,
  accessKeyId: key?.access_key_id || key?.accessKeyId || key?.access_key || null,
  secretAccessKey: key?.secret_access_key || key?.secretAccessKey || key?.secret_key || null
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
log("13. Guardado en", OUT);
log("   publicUrl:", out.publicUrl);
log("   accessKeyId:", out.accessKeyId ? "OK" : "NO");
log("   secret:", out.secretAccessKey ? "OK" : "NO");
