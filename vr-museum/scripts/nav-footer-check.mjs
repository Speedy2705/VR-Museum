import { chromium } from "@playwright/test";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3020";
const executablePath =
  process.env.BROWSER_PATH ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage();
await page.route("**/api/auth/session", (route) =>
  route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      user: { name: "Navbar Check", email: "navbar@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    }),
  }),
);
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

for (const width of [320, 375, 768, 1024, 1279, 1280, 1440, 1920]) {
  await page.setViewportSize({ width, height: 900 });
  await page.reload({ waitUntil: "domcontentloaded" });
  const dimensions = await page.locator("header").evaluate((header) => ({
    scrollWidth: header.scrollWidth,
    clientWidth: header.clientWidth,
    navHeight: header.querySelector("nav")?.getBoundingClientRect().height,
  }));
  if (dimensions.scrollWidth > dimensions.clientWidth || (dimensions.navHeight ?? 0) > 100) {
    throw new Error(`Navbar overflow/wrap at ${width}px: ${JSON.stringify(dimensions)}`);
  }
}

await page.getByRole("button", { name: "Open account menu" }).click();
await page.getByRole("menu").waitFor();
await page.keyboard.press("Escape");
await page.getByRole("menu").waitFor({ state: "detached" });
await page.getByRole("button", { name: "Open account menu" }).click();
await page.locator("main").click({ position: { x: 5, y: 200 } });
await page.getByRole("menu").waitFor({ state: "detached" });

const footerHrefs = await page.locator("footer a").evaluateAll((links) =>
  links.map((link) => link.getAttribute("href")).filter(Boolean),
);
for (const href of footerHrefs) {
  if (href === "#" || href === "") throw new Error(`Invalid footer link: ${href}`);
  if (href.startsWith("/")) {
    const response = await page.request.get(`${baseUrl}${href}`);
    if (!response.ok()) throw new Error(`Footer route ${href} returned ${response.status()}`);
  }
}

await browser.close();
console.log(JSON.stringify({ widthsChecked: 8, accountMenu: "passed", footerLinks: footerHrefs.length }, null, 2));
