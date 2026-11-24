import crypto from "node:crypto";
import fs from "node:fs";

const MAIL = "https://api.mail.tm";
const YEAP = "https://api.yeap.cloud";
const OUT = "C:\\Users\\PC Gamer\\AppData\\Local\\Temp\\opencode\\mailbox.json";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function call(url, { method = "GET", body = null, headers = {} } = {}) {
  const h = { Accept: "application/json", "User-Agent": UA, ...headers };
  if (body) h["Content-Type"] = "application/json";
  const res = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

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

let mailbox = null;
if (fs.existsSync(OUT)) {
  mailbox = JSON.parse(fs.readFileSync(OUT, "utf8"));
  console.log("Buzón existente:", mailbox.address);
} else {
  const domainsRes = await callRetry(`${MAIL}/domains`);
  const domains = listOf(domainsRes.data).filter((d) => d.isActive && !d.isPrivate).map((d) => d.domain);
  const rand = crypto.randomBytes(4).toString("hex");
  const address = `prisma${rand}@${domains[0]}`;
  const password = `Prisma-${crypto.randomBytes(8).toString("hex")}!Aa1`;
  const accountRes = await callRetry(`${MAIL}/accounts`, { method: "POST", body: { address, password } });
  console.log("Buzón:", address, accountRes.status);
  if (!accountRes.ok) process.exit(1);
  mailbox = { address, password };
  fs.writeFileSync(OUT, JSON.stringify(mailbox, null, 2));
}

const rand = crypto.randomBytes(4).toString("hex");
const username = `prisma${rand}`;
const password = mailbox.password;
const deviceId = crypto.randomBytes(32).toString("hex");

const baseHeaders = {
  Origin: "https://console.yeap.cloud",
  Referer: "https://console.yeap.cloud/register",
  "Accept-Language": "en-US,en;q=0.9",
  "X-Device-Id": deviceId
};

console.log("Register 1 (headers de navegador):");
const r1 = await call(`${YEAP}/auth/register`, {
  method: "POST",
  headers: baseHeaders,
  body: { username, email: mailbox.address, password }
});
console.log(r1.status, JSON.stringify(r1.data));

if (r1.status === 430) {
  console.log("Register 2 (sin X-Device-Id):");
  const r2 = await call(`${YEAP}/auth/register`, {
    method: "POST",
    headers: { Origin: baseHeaders.Origin, Referer: baseHeaders.Referer, "Accept-Language": baseHeaders["Accept-Language"] },
    body: { username: `prisma${crypto.randomBytes(4).toString("hex")}`, email: mailbox.address, password }
  });
  console.log(r2.status, JSON.stringify(r2.data));
}
