import { chromium } from "@playwright/test";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3022";
const executablePath =
  process.env.BROWSER_PATH ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const roles = ["VISITOR", "RESEARCHER", "ARCHAEOLOGIST", "ARTIST", "CURATOR"];
const sellers = new Set(["ARCHAEOLOGIST", "ARTIST", "CURATOR"]);
const browser = await chromium.launch({ executablePath, headless: true });

for (const role of roles) {
  const page = await browser.newPage();
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: `test-${role}`, name: role, email: `${role.toLowerCase()}@example.com`, role },
        expires: "2099-01-01T00:00:00.000Z",
      }),
    }),
  );
  await page.goto(`${baseUrl}/marketplace`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open account menu" }).waitFor();
  const sellCta = page.getByRole("link", { name: /Upload & List Artifact/i });
  if ((await sellCta.count()) !== (sellers.has(role) ? 1 : 0)) {
    throw new Error(`${role}: marketplace sell CTA visibility is incorrect`);
  }
  await page.getByRole("button", { name: "Open account menu" }).click();
  const uploadLink = page.getByRole("menuitem", { name: "Upload", exact: true });
  const moderationLink = page.getByRole("menuitem", { name: "Moderate Uploads" });
  if ((await uploadLink.count()) !== (sellers.has(role) ? 1 : 0)) {
    throw new Error(`${role}: account upload visibility is incorrect`);
  }
  if ((await moderationLink.count()) !== (role === "CURATOR" ? 1 : 0)) {
    throw new Error(`${role}: moderation visibility is incorrect`);
  }
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ rolesChecked: roles.length, clientRoleMatrix: "passed" }, null, 2));
