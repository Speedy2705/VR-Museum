const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3011";

function client() {
  const cookies = new Map();
  async function request(path, options = {}) {
    const headers = new Headers(options.headers);
    if (cookies.size) {
      headers.set(
        "cookie",
        [...cookies].map(([key, value]) => `${key}=${value}`).join("; "),
      );
    }
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      redirect: options.redirect ?? "manual",
    });
    for (const value of response.headers.getSetCookie()) {
      const [pair] = value.split(";");
      const separator = pair.indexOf("=");
      cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
    return response;
  }
  return { request };
}

async function register(api, email, password = "MuseumEdge123!") {
  return api.request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Auth Edge Test",
      email,
      password,
      role: "ARTIST",
    }),
  });
}

async function login(api, email, password) {
  const csrf = await (await api.request("/api/auth/csrf")).json();
  return api.request("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      identifier: email,
      password,
      callbackUrl: `${baseUrl}/assets`,
    }),
  });
}

const email = `batch6.${Date.now()}@example.test`;
const password = "MuseumEdge123!";
const owner = client();
const stranger = client();

const created = await register(owner, email, password);
if (created.status !== 201) throw new Error(`Registration: ${created.status}`);

const duplicate = await register(client(), email, password);
const duplicateBody = await duplicate.json();
if (duplicate.status !== 409 || duplicateBody.error?.code !== "EMAIL_TAKEN") {
  throw new Error(`Duplicate registration: ${JSON.stringify(duplicateBody)}`);
}

const wrongPassword = client();
await login(wrongPassword, email, "DefinitelyWrong123!");
const wrongSession = await (await wrongPassword.request("/api/auth/session")).json();
if (wrongSession?.user) throw new Error("Wrong password created a session");

await login(owner, email, password);
const session = await (await owner.request("/api/auth/session")).json();
if (session.user?.email !== email) throw new Error("Valid login failed");

const guestAssets = await client().request("/assets");
const redirectLocation = guestAssets.headers.get("location") ?? "";
if (
  guestAssets.status !== 307 ||
  !redirectLocation.includes("/sign-in") ||
  !redirectLocation.includes("returnTo=%2Fassets")
) {
  throw new Error(`Protected redirect: ${guestAssets.status} ${redirectLocation}`);
}
const signInPage = await client().request("/sign-in?returnTo=%2Fassets");
if (signInPage.status !== 200) throw new Error("Sign-in page redirects in a loop");

const expired = await fetch(`${baseUrl}/assets`, {
  headers: { cookie: "__Secure-authjs.session-token=expired.invalid" },
  redirect: "manual",
});
if (expired.status !== 307) throw new Error(`Expired session: ${expired.status}`);

const form = new FormData();
form.set(
  "file",
  new Blob(
    [new Uint8Array([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0, 12, 0, 0, 0])],
    { type: "model/gltf-binary" },
  ),
  "owner.glb",
);
form.set("title", `Ownership ${Date.now()}`);
form.set("category", "Test");
form.set(
  "description",
  "A valid regression artifact used to verify owner-scoped upload mutations.",
);
const uploadResponse = await owner.request("/api/upload", { method: "POST", body: form });
const uploadBody = await uploadResponse.json();
if (!uploadResponse.ok) throw new Error(`Owner upload: ${JSON.stringify(uploadBody)}`);

const strangerEmail = `batch6.stranger.${Date.now()}@example.test`;
await register(stranger, strangerEmail);
await login(stranger, strangerEmail, password);
const forbiddenMutation = await stranger.request(`/api/upload/${uploadBody.data.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "Not yours" }),
});
if (forbiddenMutation.status !== 404) {
  throw new Error(`Non-owner upload mutation: ${forbiddenMutation.status}`);
}
const ownerMutation = await owner.request(`/api/upload/${uploadBody.data.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "Owner updated" }),
});
if (!ownerMutation.ok) throw new Error(`Owner upload mutation: ${ownerMutation.status}`);

console.log(
  JSON.stringify(
    {
      wrongPasswordRejected: true,
      duplicateEmailRejected: true,
      expiredSessionRedirected: true,
      protectedRedirectLoopFree: true,
      uploadOwnershipEnforced: true,
    },
    null,
    2,
  ),
);
