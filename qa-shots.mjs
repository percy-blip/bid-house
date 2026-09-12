import { chromium } from "playwright";
const BASE = "https://bid-house-production.up.railway.app";
const user = "qa" + Date.now().toString(36);
const pass = "qapassword123";
const opt = { timeout: 6000 };
const tryDo = async (fn) => { try { await fn(); } catch (e) { console.log("skip:", e.message.split("\n")[0]); } };

const browser = await chromium.launch();
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.screenshot({ path: "qa-shots/01-auth-desktop.png" });

  await page.click("#accountToggle", opt);
  await page.fill("#username", user);
  await page.fill("#password", pass);
  await page.click("#accountSubmit");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "qa-shots/02-character-select.png" });

  await tryDo(() => page.click("#confirmCharacter", opt));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "qa-shots/03-house-browser.png" });

  await tryDo(async () => { await page.locator("[data-deploy]").first().click(opt); await page.waitForTimeout(1500); });
  await page.screenshot({ path: "qa-shots/04-hall-empty.png" });

  await tryDo(async () => { await page.locator("#openBox").click(opt); await page.waitForTimeout(700); });
  await page.screenshot({ path: "qa-shots/05-box-reveal.png" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "qa-shots/06-hall-desktop.png" });
  console.log("desktop shots done");

  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mp = await mctx.newPage();
  await mp.goto(BASE, { waitUntil: "networkidle" });
  await mp.screenshot({ path: "qa-shots/08-auth-mobile.png" });
  await mp.fill("#username", user);
  await mp.fill("#password", pass);
  await mp.click("#accountSubmit");
  await mp.waitForTimeout(2500);
  await mp.screenshot({ path: "qa-shots/09-mobile-post-login.png" });
  await tryDo(async () => { await mp.locator("[data-enter]").first().click(opt); await mp.waitForTimeout(1500); });
  await mp.screenshot({ path: "qa-shots/10-hall-mobile.png" });
  console.log("mobile shots done");
  console.log("JS errors:", errors.length ? errors.slice(0, 6) : "none");
  await ctx.close(); await mctx.close();
} finally { await browser.close(); }
