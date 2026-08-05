import { chromium } from "@playwright/test";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3022";
const executablePath = process.env.BROWSER_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const roles = ["VISITOR", "RESEARCHER", "ARCHAEOLOGIST", "ARTIST", "CURATOR"];
const sellers = new Set(["ARCHAEOLOGIST", "ARTIST", "CURATOR"]);
const browser = await chromium.launch({ executablePath, headless: true });

for (const role of roles) {
  const context = await browser.newContext();
  const email = `role-ui.${role.toLowerCase()}.${Date.now()}@example.test`;
  const password = "MuseumFlow123!";
  const registration = await context.request.post(`${baseUrl}/api/auth/register`, { data: { name: role, email, password, role } });
  if (!registration.ok()) throw new Error(`${role}: registration failed (${registration.status()})`);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/sign-in?returnTo=/marketplace`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email or mobile number").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL("**/marketplace");
  await page.getByRole("button", { name: "Open account menu" }).waitFor();
  const sellCta = page.getByRole("link", { name: /Upload & List Artifact/i });
  if ((await sellCta.count()) !== (sellers.has(role) ? 1 : 0)) throw new Error(`${role}: marketplace sell CTA visibility is incorrect`);
  await page.getByRole("button", { name: "Open account menu" }).click();
  if ((await page.getByRole("menuitem", { name: "Upload", exact: true }).count()) !== (sellers.has(role) ? 1 : 0)) throw new Error(`${role}: upload visibility is incorrect`);
  if ((await page.getByRole("menuitem", { name: "Moderate Uploads" }).count()) !== (role === "CURATOR" ? 1 : 0)) throw new Error(`${role}: moderation visibility is incorrect`);
  await context.close();
}
await browser.close();
console.log(JSON.stringify({ rolesChecked: roles.length, clientRoleMatrix: "passed" }, null, 2));
