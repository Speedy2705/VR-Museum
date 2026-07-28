import { chromium } from "@playwright/test";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3020";
const executablePath =
  process.env.BROWSER_PATH ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const problems = [];

page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    problems.push(`console.${message.type()}: ${message.text()}`);
  }
});
page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
page.on("requestfailed", (request) => {
  // Next.js cancels speculative RSC prefetches when the crawl navigates away.
  if (
    request.failure()?.errorText === "net::ERR_ABORTED" &&
    request.url().includes("_rsc=")
  ) {
    return;
  }
  problems.push(
    `requestfailed: ${request.method()} ${request.url()} (${request.failure()?.errorText})`,
  );
});

async function apiItems(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  const body = await response.json();
  return body.data?.items ?? body.data ?? [];
}

const [collections, artifacts, marketplace] = await Promise.all([
  apiItems("/api/collections"),
  apiItems("/api/artifacts"),
  apiItems("/api/marketplace?limit=100"),
]);

const paths = [
  "/",
  "/about",
  "/collections",
  "/marketplace",
  "/sign-in",
  "/sign-up",
  ...collections.map((collection) => `/collections/${collection.slug}`),
  ...artifacts.map(
    (artifact) =>
      `/collections/${artifact.collection.slug}/${artifact.slug}`,
  ),
  ...marketplace.map((entry) =>
    entry.source === "community"
      ? `/community/${entry.item.id}`
      : `/marketplace/${entry.item.artifact.slug}`,
  ),
];

for (const path of paths) {
  const response = await page.goto(`${baseUrl}${path}`, {
    waitUntil: "networkidle",
  });
  if (!response?.ok()) {
    problems.push(`navigation: ${path} returned ${response?.status()}`);
  }
}

for (const protectedPath of ["/checkout", "/assets"]) {
  await page.goto(`${baseUrl}${protectedPath}`, { waitUntil: "networkidle" });
  if (!page.url().includes("/sign-in")) {
    problems.push(`auth: ${protectedPath} did not redirect to sign-in`);
  }
}

for (const gatedPath of ["/cart", "/upload"]) {
  await page.goto(`${baseUrl}${gatedPath}`, { waitUntil: "networkidle" });
  if ((await page.getByRole("link", { name: /sign in/i }).count()) === 0) {
    problems.push(`auth: ${gatedPath} did not show a guest sign-in prompt`);
  }
}

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.locator('button[aria-label="Search artifacts"]').evaluate((button) => button.click());
await page.locator("#navbar-search").fill("amphora");
await page.waitForLoadState("networkidle");
if ((await page.getByRole("link", { name: /amphora/i }).count()) === 0) {
  problems.push("flow: navbar artifact search returned no results");
}

await browser.close();

if (problems.length) {
  throw new Error(
    `Browser regression found ${problems.length} problem(s):\n${problems.join("\n")}`,
  );
}

console.log(
  JSON.stringify(
    {
      pagesChecked: paths.length,
      protectedFlowsChecked: 4,
      consoleErrorsOrWarnings: 0,
      pageErrors: 0,
      searchFlow: "passed",
    },
    null,
    2,
  ),
);
