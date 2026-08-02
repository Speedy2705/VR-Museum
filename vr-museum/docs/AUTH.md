# Authentication setup

ViswaRoop supports credentials, Google, and Apple sign-in through Auth.js and the
Prisma adapter. The canonical profile roles are Artist, Curator,
Archaeologist, Researcher, and Visitor.

## Role meanings

- **Artist** — creates or contributes digital artifact models.
- **Curator** — researches and presents collections and interpretation.
- **Archaeologist** — contributes archaeological context and provenance.
- **Researcher** — studies artifacts and uses museum data for research.
- **Visitor** — primarily browses, purchases, and experiences the museum.

These roles describe how a member uses the museum and now drive authorization.
See [ROLES.md](ROLES.md) for the complete permission matrix.

## Google

1. Create or select a Google Cloud project and configure its OAuth consent
   screen.
2. Create an OAuth client with application type **Web application**.
3. Add `http://localhost:3000` as a development origin.
4. Add `http://localhost:3000/api/auth/callback/google` as a development
   redirect URI and `<production-origin>/api/auth/callback/google` for
   production. Redirect URIs must match exactly.
5. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

Google's official setup and redirect requirements are documented in
[OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
and the [Google OIDC API reference](https://developers.google.com/identity/openid-connect/reference).

## Apple

Apple requires an Apple Developer Program account and a public HTTPS domain for
web sign-in.

1. Enable Sign in with Apple on a primary App ID.
2. Create a Services ID and associate it with that App ID.
3. Configure the production domain and
   `<production-origin>/api/auth/callback/apple` return URL.
4. Create a Sign in with Apple private key.
5. Generate a client-secret JWT using the Team ID, Key ID, Services ID, and
   private key. Set the Services ID as `AUTH_APPLE_ID` and the JWT as
   `AUTH_APPLE_SECRET`. Rotate the JWT before its configured expiration.

See Apple's official guides for
[configuring the environment](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple)
and [configuring Sign in with Apple for the web](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web).

## First login and account linking

OAuth-created users have no role initially. Auth.js sends a newly created user
to `/complete-profile`; protected cart, checkout, upload, and asset routes also
redirect role-less sessions there. Saving a role refreshes the JWT, so the
prompt is not shown again.

Google and Apple are configured to link an OAuth identity to an existing user
with the same normalized email. This relies on the providers' verified email
claims. Do not enable this behavior for providers that do not verify email.
Apple users who choose Hide My Email receive a relay address and therefore do
not link to an existing account registered under a different address.

The Prisma `Account.userId` foreign key links provider identities to `User`,
with a unique `(provider, providerAccountId)` constraint and cascading cleanup.
The `Session.userId` relationship is also correct, although this application
uses JWT sessions, so Auth.js does not normally create `Session` rows.

## OAuth errors

Consent denial and provider/callback failures return to `/sign-in?error=…`.
The sign-in UI currently displays a generic retry-or-password message; detailed
theming is intentionally deferred.

## Live checkpoint

After provider credentials are configured, test each provider with a new
provider account and then repeat with the same account:

1. The first login must land on `/complete-profile`.
2. Select a role and confirm the requested protected destination opens.
3. Sign out and sign in again; the completion page must not reappear.
4. For email linking, create a credentials user using the provider's verified
   email, sign in with the provider, and confirm the database contains one
   `User` with both the credentials password hash and linked `Account` row.

Apple's Hide My Email relay address cannot be used to test same-email linking
unless that relay address is also used for the credentials account.
