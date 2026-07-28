import { chromium } from "@playwright/test";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3000";
const executablePath =
  process.env.BROWSER_PATH ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await chromium.launch({ executablePath, headless: true });

async function checkDesktop(path) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference" });
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  const badges = page.getByText(/^(▶ Video|◇ 360°)$/);
  const count = await badges.count();
  if (!count) {
    const labels = await page.locator("span").allTextContents();
    throw new Error(
      `${path}: no immersive-media badges found; url=${page.url()}; body=${(
        await page.locator("body").innerText()
      ).slice(0, 500)}; labels=${labels.join(" | ")}`,
    );
  }
  const card = badges.first().locator("xpath=ancestor::a[1]");
  await card.hover();
  await page.waitForTimeout(350);
  const previewCount = await card.locator("video, model-viewer").count();
  if (!previewCount) throw new Error(`${path}: hover did not mount a preview`);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(350);
  if (await card.locator("video, model-viewer").count()) {
    throw new Error(`${path}: preview did not unload after pointer leave`);
  }
  await page.close();
  return count;
}

const desktopResults = {};
for (const path of ["/marketplace", "/collections/earth-fire"]) {
  desktopResults[path] = await checkDesktop(path);
}

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(`${baseUrl}/marketplace`, { waitUntil: "networkidle" });
const mobileBadges = mobile.getByText(/^(▶ Video|◇ 360°)$/);
if (!(await mobileBadges.count())) throw new Error("mobile: media badges are missing");
await mobileBadges.first().locator("..").hover();
await mobile.waitForTimeout(350);
if (await mobile.locator("video, model-viewer").count()) {
  throw new Error("mobile: preview media mounted on a touch viewport");
}

await mobile.close();
await browser.close();
console.log(JSON.stringify({ desktopResults, mobile: "static badge only" }, null, 2));
