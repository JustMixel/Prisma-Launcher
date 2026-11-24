import { chromium } from "playwright-core";
import fs from "node:fs";

const OUT = "F:\\Games\\Zelda Remake\\Triforce\\Temp\\yeap-work\\tm-org";
fs.mkdirSync(OUT, { recursive: true });

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
  });
  const page = await context.newPage();
  const reqs = [];
  const jsons = [];

  page.on("request", (r) => {
    const u = r.url();
    if (!/\.(png|jpg|jpeg|gif|svg|woff2?|css)(\?|$)/i.test(u)) reqs.push(`${r.method()} ${r.resourceType()} ${u}`);
  });
  page.on("response", async (r) => {
    const ct = r.headers()["content-type"] || "";
    if (ct.includes("json")) {
      let body = "";
      try { body = (await r.text()).slice(0, 1500); } catch {}
      jsons.push(`${r.status()} ${r.url()}\n${body}\n`);
    }
  });

  await page.goto("https://temp-mail.org/en/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(15000);

  const info = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    text: document.body.innerText.slice(0, 1500)
  }));
  console.log("title:", info.title);
  console.log("url:", info.url);
  console.log("text:", info.text.replace(/\n+/g, " | ").slice(0, 800));

  fs.writeFileSync(`${OUT}\\requests.txt`, reqs.join("\n"));
  fs.writeFileSync(`${OUT}\\json.txt`, jsons.join("\n---\n"));
  await page.screenshot({ path: `${OUT}\\page.png`, fullPage: false });

  console.log("\nJSON responses:");
  console.log(jsons.join("\n---\n").slice(0, 3000));
} finally {
  await browser.close();
}
