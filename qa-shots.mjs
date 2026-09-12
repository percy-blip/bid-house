import { chromium } from "playwright";
const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const user = "qa" + Date.now().toString(36);
const pass = "qapassword123";
const opt = { timeout: 6000 };

async function visible(page, selector, label) {
  const target = page.locator(selector);
  await target.waitFor({ state: "visible", ...opt });
  if (await target.evaluate((el) => el.classList.contains("hidden"))) throw new Error(`${label} still has hidden`);
  console.log(`assert visible: ${label}`);
}
async function hallReady(page, label) {
  await visible(page, "#gameView", label);
  await page.waitForFunction(() => [".bid-controls", "#inventory", "#auctions"].some((selector) => { const el = document.querySelector(selector); return el && el.offsetParent !== null && (el.textContent?.trim().length ?? 0) > 0; }), undefined, opt).catch(() => { throw new Error(`${label} has no populated bid panel, inventory, or feed text`); });
  const emptyFloor = await page.locator("#auctions .empty").isVisible().catch(() => false);
  console.log(`${label}: ${emptyFloor ? "empty floor (labeled by feed text)" : "populated auction layout"}`);
}

const browser = await chromium.launch();
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await visible(page, "#accountView", "desktop account");
  await page.screenshot({ path: "qa-shots/01-auth-desktop.png" });
  try {
    await page.click("#accountToggle", opt);
    await page.fill("#username", user); await page.fill("#password", pass); await page.click("#accountSubmit");
    await visible(page, "#characterView", "desktop character select");
    for (const expected of [2, 3, 4, 5, 6, 1, 2]) { await page.click("#characterNext", opt); await page.waitForFunction((count) => document.querySelector("#carouselCount")?.textContent?.startsWith(`${count} `), expected, opt); }
    await page.screenshot({ path: "qa-shots/02-character-select.png" });
    await page.click("#confirmCharacter", opt);
    await visible(page, "#houseView", "desktop house directory");
    await page.screenshot({ path: "qa-shots/03-house-browser.png" });
    await page.locator("[data-deploy]").first().click(opt);
    await hallReady(page, "desktop hall");
    await page.screenshot({ path: "qa-shots/04-hall-empty.png" });
    await page.locator("#openBox").click(opt);
    await visible(page, "#boxReveal", "box reveal");
    await page.screenshot({ path: "qa-shots/05-box-reveal.png" });
    await page.click("#skipReveal", opt);
    await hallReady(page, "desktop hall after reveal");
    await page.screenshot({ path: "qa-shots/06-hall-desktop.png" });
    console.log("desktop shots done");
  } catch (e) { console.error("desktop branch stopped:", e.message); }

  const authMobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const authMobile = await authMobileCtx.newPage();
  await authMobile.goto(BASE, { waitUntil: "networkidle" });
  await visible(authMobile, "#accountView", "mobile account");
  await authMobile.screenshot({ path: "qa-shots/08-auth-mobile.png" });
  await authMobileCtx.close();
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await hallReady(page, "mobile hall");
    await page.screenshot({ path: "qa-shots/09-mobile-post-login.png" });
    await page.locator('[data-panel="floor"]').click(opt);
    await visible(page, "#floorPanel", "mobile floor panel");
    await hallReady(page, "mobile floor hall");
    await page.screenshot({ path: "qa-shots/10-hall-mobile.png" });
    console.log("mobile shots done");
  } catch (e) { console.error("mobile branch stopped:", e.message); }
  console.log("JS errors:", errors.length ? errors.slice(0, 6) : "none");
  await ctx.close();
} finally { await browser.close(); }
