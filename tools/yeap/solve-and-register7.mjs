import { chromium } from "playwright-core";
import fs from "node:fs";
import { PNG } from "pngjs";

const OUT = "F:\\Games\\Zelda Remake\\Triforce\\Temp\\yeap-work\\register-solve7";
fs.mkdirSync(OUT, { recursive: true });
const mailbox = JSON.parse(fs.readFileSync("F:\\Games\\Zelda Remake\\Triforce\\Temp\\yeap-work\\mailbox.json", "utf8"));
const username = `prisma${Math.random().toString(16).slice(2, 10)}`;
const email = process.argv[2] ? process.argv[2].replace("{user}", username) : mailbox.address;
const password = mailbox.password;

function grayAt(img, x, y) {
  const i = (y * img.width + x) * 4;
  return 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
}

function edgeMap(img) {
  const w = img.width, h = img.height;
  const g = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g[y * w + x] = grayAt(img, x, y);
  const mag = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -g[(y - 1) * w + (x - 1)] - 2 * g[y * w + (x - 1)] - g[(y + 1) * w + (x - 1)] +
         g[(y - 1) * w + (x + 1)] + 2 * g[y * w + (x + 1)] + g[(y + 1) * w + (x + 1)];
      const gy =
        -g[(y - 1) * w + (x - 1)] - 2 * g[(y - 1) * w + x] - g[(y - 1) * w + (x + 1)] +
         g[(y + 1) * w + (x - 1)] + 2 * g[(y + 1) * w + x] + g[(y + 1) * w + (x + 1)];
      mag[y * w + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return mag;
}

function solveEdge(canvasBuf, pieceBuf, fixedY) {
  const canvas = PNG.sync.read(canvasBuf);
  const piece = PNG.sync.read(pieceBuf);
  const W = canvas.width, H = canvas.height;
  const pw = piece.width, ph = piece.height;
  const mask = [];
  const mset = new Set();
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const i = (y * pw + x) * 4;
      if (piece.data[i + 3] > 128) {
        mask.push([x, y]);
        mset.add(`${x},${y}`);
      }
    }
  }
  const boundary = mask.filter(([x, y]) =>
    !mset.has(`${x - 1},${y}`) || !mset.has(`${x + 1},${y}`) ||
    !mset.has(`${x},${y - 1}`) || !mset.has(`${x},${y + 1}`)
  );
  const cEdge = edgeMap(canvas);
  const oy = Math.max(0, Math.min(H - ph, Math.round(fixedY)));
  const candidates = [];
  for (let ox = 0; ox <= W - pw; ox++) {
    let sum = 0, n = 0;
    for (const [px, py] of boundary) {
      const cx = ox + px, cy = oy + py;
      if (cx < 1 || cy < 1 || cx >= W - 1 || cy >= H - 1) continue;
      let mx = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const v = cEdge[(cy + dy) * W + (cx + dx)];
          if (v > mx) mx = v;
        }
      }
      sum += mx;
      n++;
    }
    if (n < boundary.length * 0.9) continue;
    candidates.push({ ox, oy, score: +(sum / n).toFixed(2), n });
  }
  candidates.sort((a, b) => b.score - a.score);
  return { best: candidates[0], top: candidates.slice(0, 6), canvasW: W, canvasH: H, pieceW: pw, pieceH: ph, boundaryCount: boundary.length };
}

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: false,
  args: ["--disable-blink-features=AutomationControlled", "--start-maximized"]
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
  });
  await context.addInitScript(() => {
    try { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); } catch {}
    try { delete window.__playwright; delete window.__pw_manual; delete window.__puppeteer; } catch {}
    window.__captchaToken = null;
    window.__captchaAnswer = null;
    window.__captchaType = null;
    window.__passToken = null;
    window.addEventListener("ratelimit:captcha", (e) => {
      const d = e && e.detail;
      if (!d || typeof d.onSuccess !== "function") return;
      const orig = d.onSuccess;
      d.onSuccess = function (token, answer, type) {
        window.__captchaToken = token;
        window.__captchaAnswer = answer;
        window.__captchaType = type;
        console.log("[hook] captcha onSuccess " + JSON.stringify({ token, answer, type }));
        return orig.call(this, token, answer, type);
      };
    }, true);

    const text = (buf) => { try { return new TextDecoder().decode(buf); } catch { return ""; } };
    try {
      const origDecrypt = SubtleCrypto.prototype.decrypt;
      SubtleCrypto.prototype.decrypt = async function (algorithm, key, data) {
        const result = await origDecrypt.call(this, algorithm, key, data);
        try {
          const bytes = new Uint8Array(result);
          if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
            const plain = await new Response(stream).text();
            console.log("[crypto:json] " + plain.slice(0, 8000));
            try {
              const parsed = JSON.parse(plain);
              window.__challenge = parsed;
              if (parsed?.data?.pass_token) window.__passToken = parsed.data.pass_token;
            } catch {}
          } else {
            const out = text(result);
            console.log("[crypto] decrypt outLen=" + bytes.length + " text=" + out.slice(0, 2000));
            if (out.includes("pass_token")) {
              const parsed = JSON.parse(out);
              if (parsed?.data?.pass_token) window.__passToken = parsed.data.pass_token;
            }
          }
        } catch (e) {
          console.log("[crypto] hook error " + (e && e.message));
        }
        return result;
      };
    } catch {}
  });

  const page = await context.newPage();
  const log = [];
  const allUrls = [];
  let verifyResolve;
  const verifyDone = new Promise((r) => { verifyResolve = r; });
  let verifyStatus = null;
  const registerResponses = [];
  let challengeCid = null;

  page.on("request", (req) => {
    const url = req.url();
    allUrls.push(req.method() + " " + url);
    if (url.includes("/challenge/verify")) {
      const h = req.headers();
      if (h["x-captcha-cid"]) challengeCid = h["x-captcha-cid"];
    }
    if (/challenge\/verify|yeap\.cloud\/auth\/register/i.test(url)) {
      log.push(`>>> ${req.method()} ${url}\nHEADERS ${JSON.stringify(req.headers()).slice(0, 4000)}\n${req.postData() ? req.postData().slice(0, 4000) : ""}\n`);
    }
  });
  page.on("response", async (res) => {
    const url = res.url();
    if (/challenge\/verify|yeap\.cloud\/auth\/register/i.test(url)) {
      let body = "";
      try { body = (await res.text()).slice(0, 5000); } catch {}
      log.push(`<<< ${res.status()} ${url}\nHEADERS ${JSON.stringify(res.headers()).slice(0, 2000)}\n${body}\n`);
      if (url.includes("/challenge/verify")) {
        verifyStatus = res.status();
        verifyResolve();
      }
      if (url.includes("/auth/register")) {
        registerResponses.push({ status: res.status(), body: body.slice(0, 3000) });
      }
    }
  });
  page.on("console", (msg) => log.push(`[console:${msg.type()}] ${msg.text()}\n`));
  page.on("pageerror", (err) => log.push(`[pageerror] ${err.message}\n`));

  await page.route("**/auth/register", async (route) => {
    const req = route.request();
    const headers = { ...req.headers() };
    if (!headers["x-captcha-id"] || !String(headers["x-captcha-id"]).startsWith("pt_")) {
      return route.continue();
    }
    await Promise.race([verifyDone, new Promise((r) => setTimeout(r, 10000))]);
    await new Promise((r) => setTimeout(r, 1200));
    return route.continue();
  });

  await page.goto("https://console.yeap.cloud/register", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.getByPlaceholder("Username").fill(username);
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill(password);
  await page.getByPlaceholder("Confirm password").fill(password);
  await page.getByRole("button", { name: "Register" }).first().click();
  await page.waitForTimeout(7000);

  async function captchaProbe() {
    return page.evaluate(() => {
      const host = [...document.querySelectorAll("*")].find(
        (e) =>
          e.shadowRoot &&
          (e.shadowRoot.querySelector("canvas.captchala-picture") ||
            e.shadowRoot.querySelector(".captchala-drag-block") ||
            e.shadowRoot.querySelector(".captchala-trigger-control"))
      );
      if (!host) return { host: false };
      const root = host.shadowRoot;
      return {
        host: true,
        hasCanvas: !!root.querySelector("canvas.captchala-picture"),
        hasDrag: !!root.querySelector(".captchala-drag-block"),
        hasTrigger: !!root.querySelector(".captchala-trigger-control"),
        classes: [...root.querySelectorAll("*")]
          .map((e) => (e.className && typeof e.className === "string" ? e.className : ""))
          .filter(Boolean)
          .slice(0, 80)
      };
    });
  }

  let captchaState = null;
  let clickedTrigger = false;
  for (let i = 0; i < 80; i++) {
    captchaState = await captchaProbe();
    if (captchaState.hasDrag) break;
    if (captchaState.hasTrigger && !clickedTrigger) {
      clickedTrigger = true;
      try {
        await page.locator(".captchala-trigger-control").first().click({ timeout: 5000 });
        log.push("[captcha] clicked trigger\n");
      } catch (e) {
        log.push(`[captcha] trigger click failed: ${e.message}\n`);
      }
    }
    await page.waitForTimeout(500);
  }
  log.push(`[captcha] ${JSON.stringify(captchaState)}\n`);

  if (captchaState?.hasCanvas && !captchaState.hasDrag) {
    for (let r = 1; r <= 8; r++) {
      try {
        const btns = page.locator(".captchala-action-btn");
        const n = await btns.count();
        if (n < 2) break;
        await btns.nth(1).click({ timeout: 3000 });
      } catch (e) {
        log.push(`[captcha] refresh click failed: ${e.message}\n`);
      }
      await page.waitForTimeout(2500);
      captchaState = await captchaProbe();
      log.push(`[captcha] refresh ${r} -> ${JSON.stringify(captchaState)}\n`);
      if (captchaState?.hasDrag) break;
    }
  }

  if (!captchaState?.hasDrag) {
    try { await page.screenshot({ path: `${OUT}\\captcha-fail.png` }); } catch {}
    fs.writeFileSync(`${OUT}\\log.txt`, log.join(""));
    fs.writeFileSync(`${OUT}\\urls.txt`, allUrls.join("\n"));
    throw new Error("captcha drag block never appeared: " + JSON.stringify(captchaState));
  }
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    const host = [...document.querySelectorAll("*")].find((e) => e.shadowRoot);
    if (!host) return { error: "no shadow host" };
    const canvas = host.shadowRoot.querySelector("canvas.captchala-picture");
    const img = host.shadowRoot.querySelector("img");
    const handle = host.shadowRoot.querySelector(".captchala-drag-block");
    return {
      canvas: canvas ? canvas.toDataURL("image/png") : null,
      piece: img ? img.src : null,
      canvasRect: canvas ? canvas.getBoundingClientRect().toJSON() : null,
      imgRect: img ? img.getBoundingClientRect().toJSON() : null,
      handleRect: handle ? handle.getBoundingClientRect().toJSON() : null
    };
  });
  if (data.error) throw new Error(data.error);
  if (!data.canvas || !data.piece || !data.handleRect) throw new Error("missing captcha elements: " + JSON.stringify(data));

  const canvasBuf = Buffer.from(data.canvas.split(",")[1], "base64");
  const pieceRes = await fetch(data.piece);
  const pieceBuf = Buffer.from(await pieceRes.arrayBuffer());
  fs.writeFileSync(`${OUT}\\canvas.png`, canvasBuf);
  fs.writeFileSync(`${OUT}\\piece.png`, pieceBuf);

  const initialPieceX = data.imgRect.x - data.canvasRect.x;
  const initialPieceY = data.imgRect.y - data.canvasRect.y;
  const solution = solveEdge(canvasBuf, pieceBuf, initialPieceY);
  log.push(`[solution] ${JSON.stringify(solution)} initialPieceX=${initialPieceX} initialPieceY=${initialPieceY}\n`);
  const targetX = solution.best.ox;

  async function readCaptchaState() {
    return page.evaluate(() => {
      const host = [...document.querySelectorAll("*")].find(
        (e) => e.shadowRoot && e.shadowRoot.querySelector("canvas.captchala-picture")
      );
      if (!host) return null;
      const canvas = host.shadowRoot.querySelector("canvas.captchala-picture");
      const img = host.shadowRoot.querySelector("img");
      const handle = host.shadowRoot.querySelector(".captchala-drag-block");
      if (!canvas || !img || !handle) return null;
      return {
        pieceX: img.getBoundingClientRect().x - canvas.getBoundingClientRect().x,
        handle: handle.getBoundingClientRect().toJSON()
      };
    });
  }

  let dragOk = false;
  let required = 0;
  for (let attempt = 1; attempt <= 4 && !dragOk; attempt++) {
    const state = await readCaptchaState();
    if (!state) {
      await page.waitForTimeout(600);
      continue;
    }
    const hx = state.handle.x + state.handle.width / 2;
    const hy = state.handle.y + state.handle.height / 2;
    const startPieceX = state.pieceX;
    await page.mouse.move(hx, hy);
    await page.waitForTimeout(150);
    await page.mouse.down();
    await page.waitForTimeout(150);
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(hx + (24 * i) / 8, hy + Math.sin(i) * 0.4);
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(180);
    const probe = await readCaptchaState();
    const moved = probe ? probe.pieceX - startPieceX : 0;
    const scale = moved / 24;
    log.push(`[probe] attempt=${attempt} moved=${moved} scale=${scale}\n`);
    if (moved > 5) {
      dragOk = true;
      required = (targetX - startPieceX) / (Math.abs(scale) > 0.2 ? scale : 1);
      log.push(`[drag] targetX=${targetX} startPieceX=${startPieceX} required=${required}\n`);
      const steps = 26;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const x = hx + 24 + (required - 24) * eased;
        const y = hy + Math.sin(i * 1.7) * 1.1;
        await page.mouse.move(x, y);
        await page.waitForTimeout(16 + (i % 3) * 5);
      }
      await page.waitForTimeout(250);
      await page.mouse.up();
    } else {
      await page.mouse.up();
      await page.waitForTimeout(600);
    }
  }
  if (!dragOk) log.push("[drag] failed after retries\n");

  await Promise.race([verifyDone, new Promise((r) => setTimeout(r, 15000))]);
  await page.waitForTimeout(4000);

  const after = await page.evaluate(() => ({
    url: location.href,
    token: window.__captchaToken,
    passToken: window.__passToken,
    answer: window.__captchaAnswer,
    type: window.__captchaType
  }));
  log.push(`[after] ${JSON.stringify({ ...after, token: after.token ? "pt_yes" : null, passToken: after.passToken ? "pt_yes" : null })}\n`);
  log.push(`[registerResponses] ${JSON.stringify(registerResponses)}\n`);

  fs.writeFileSync(`${OUT}\\log.txt`, log.join(""));

  console.log("username:", username);
  console.log("email:", email);
  console.log("solution:", JSON.stringify(solution.best), "top:", JSON.stringify(solution.top));
  console.log("verifyStatus:", verifyStatus, "passToken:", after.passToken ? "yes" : "no");
  console.log("registerResponses:", JSON.stringify(registerResponses, null, 2));

  const success = registerResponses.some((r) => r.status === 200);
  if (success) {
    const login = await fetch("https://api.yeap.cloud/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://console.yeap.cloud", Referer: "https://console.yeap.cloud/" },
      body: JSON.stringify({ username, password, cfkey: null, remember: true })
    });
    const loginText = await login.text();
    console.log("login status:", login.status, "body:", loginText.slice(0, 300));
    let token = null;
    try { token = JSON.parse(loginText)?.token || null; } catch {}
    if (token) {
      const overview = await fetch("https://api.yeap.cloud/api/user/s3/overview", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", Origin: "https://console.yeap.cloud", Referer: "https://console.yeap.cloud/" }
      });
      console.log("s3 overview status:", overview.status, "body:", (await overview.text()).slice(0, 500));
      const regions = await fetch("https://api.yeap.cloud/api/user/s3/regions", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", Origin: "https://console.yeap.cloud", Referer: "https://console.yeap.cloud/" }
      });
      console.log("s3 regions status:", regions.status, "body:", (await regions.text()).slice(0, 800));
      fs.writeFileSync(`${OUT}\\token.txt`, token);
    }
  }
} finally {
  await browser.close();
}
