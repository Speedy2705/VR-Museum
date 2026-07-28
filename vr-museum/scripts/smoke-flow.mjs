const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3011";
const cookies = new Map();

function absorbCookies(response) {
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const separator = pair.indexOf("=");
    cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  if (cookies.size) {
    headers.set(
      "cookie",
      [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
    );
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    redirect: options.redirect ?? "follow",
  });
  absorbCookies(response);
  return response;
}

async function json(path, options = {}) {
  const response = await request(path, options);
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new Error(`${options.method ?? "GET"} ${path}: ${JSON.stringify(body)}`);
  }
  return body;
}

const email = `batch5.${Date.now()}@example.test`;
const password = "MuseumFlow123!";

const protectedGuest = await fetch(`${baseUrl}/assets`, { redirect: "manual" });
if (protectedGuest.status !== 307) {
  throw new Error(`Expected guest /assets redirect, got ${protectedGuest.status}`);
}

await json("/api/auth/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "Batch Five Flow", email, password }),
});

const csrf = await (await request("/api/auth/csrf")).json();
const signInBody = new URLSearchParams({
  csrfToken: csrf.csrfToken,
  email,
  password,
  callbackUrl: `${baseUrl}/marketplace`,
});
await request("/api/auth/callback/credentials", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: signInBody,
  redirect: "manual",
});

const session = await (await request("/api/auth/session")).json();
if (session?.user?.email !== email) throw new Error("Credentials sign-in failed");

const marketplace = await json("/api/marketplace?limit=1");
const listing = marketplace.data.items[0];
await json("/api/cart", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ listingId: listing.id, quantity: 1 }),
});
const order = await json("/api/checkout", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "{}",
});

const uploadForm = new FormData();
uploadForm.set(
  "file",
  new Blob(["batch-five-local-storage-check"], {
    type: "model/gltf-binary",
  }),
  "batch-five-smoke.glb",
);
uploadForm.set("title", "Batch Five Uploaded Artifact");
uploadForm.set("category", "Test");
uploadForm.set("type", "3d-model");
uploadForm.set("origin", "Local smoke test");
uploadForm.set("lighting", "cool-ambient");
uploadForm.set("license", "cc0");
const upload = await json("/api/upload", {
  method: "POST",
  body: uploadForm,
});

const assetsPage = await request("/assets");
const assetsHtml = await assetsPage.text();
if (
  !assetsPage.ok ||
  !assetsHtml.includes(listing.artifact.title) ||
  !assetsHtml.includes("Batch Five Uploaded Artifact")
) {
  throw new Error("Your Assets did not render the order and upload");
}

console.log(
  JSON.stringify(
    {
      registered: email,
      signedIn: session.user.email,
      purchased: listing.artifact.slug,
      orderId: order.data.id,
      uploadId: upload.data.id,
      assetsRendered: true,
      guestProtection: protectedGuest.status,
    },
    null,
    2,
  ),
);
