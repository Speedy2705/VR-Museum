# Multilingual coverage audit

Implementation checklist originally completed during the multilingual coverage
work and reviewed for documentation accuracy on 2026-08-09. Environment-blocked
items below describe the original QA environment; current releases should use
the live checklist in [FINAL_QA.md](FINAL_QA.md).

## Broken and fixed

- [x] Form-control attributes were skipped. `CachedPageTranslator` excluded `input` and `textarea` elements before collecting `placeholder`, `title`, `aria-label`, and `alt`; attributes on those controls now participate while user-entered values remain excluded.
- [x] Attribute-only and character-data updates were invisible. The observer now watches the supported attributes and `characterData`, not only inserted/removed child nodes.
- [x] Applying a translation could lose the English lookup key, which made subsequent state-driven text/attribute changes unreliable. Per-node source text is now retained and refreshed when React supplies a genuinely new source value.
- [x] Pages with more than 120 phrases could stall after the first cached batch because truncation happened before cached phrases were removed. Missing phrases are now filtered before the API-sized 120-phrase slice.
- [x] `<title>` and description/Open Graph metadata were outside the observed body. The DOM fallback now includes supported head metadata, and server metadata is locale-aware so crawlers receive localized metadata in initial HTML when the translation cache/provider is available.
- [x] Static metadata on About, Assets, Cart, Checkout, Collections, Marketplace, Moderation, Sign in, Sign up, Support, Upload, and VR was English-only. Each now resolves through the persistent UI translation cache.
- [x] Dynamic collection, artifact, and marketplace metadata used English DB records. It now uses localized DB content plus localized UI qualifiers/not-found copy.
- [x] A translation-cache/database outage could make localized metadata generation fail the entire page. Metadata now falls back to English on cache/provider failure.
- [x] A logged-in language save updated `User.locale` but left the active Auth.js JWT stale, and API failures were silently followed by navigation. A successful save now refreshes the session; a failed save restores the prior cookie, shows an error, and does not navigate.
- [x] Language changes had no explicit pending state during preference persistence/full-page navigation. A brief full-screen overlay now appears before the request/navigation, disables repeated selection, remains through document replacement, and clears if persistence fails.
- [x] Clear RTL physical-direction bugs were corrected: Navbar/account-menu edges and text alignment, product-card badge edges/spacing, upload-wizard control alignment/spacing, checkout required-marker/spinner/error-border spacing, and marketplace pagination-arrow mirroring now use logical or RTL-aware styles.

## Checked and already correct

- [x] All `museumToast.*` calls render through Sonner's `<Toaster>` under `document.body`; inserted toast title/description nodes are observed. No direct `toast.*` bypass was found outside the wrapper.
- [x] `ConfirmDialog` is the only explicit React portal. It portals to `document.body`, so dialog headings, descriptions, buttons, validation copy, and child content are observed.
- [x] No `alert()`, `window.alert()`, `confirm()`, `setCustomValidity()`, or separately mounted popover/tooltip portal was found in `src/`.
- [x] Inline validation messages, empty states, loading states, error boundaries, modal copy, placeholders, titles, alt text, and ARIA labels are either ordinary body DOM or covered attributes. Native browser constraint-validation bubbles remain browser-controlled and follow the browser/OS language, not the app locale.
- [x] DB-localized artifact/collection nodes intentionally marked `data-no-translate` remain excluded so the UI translator cannot translate already-localized content a second time.
- [x] Language names remain native-language identifiers inside a deliberate `data-no-translate` selector.
- [x] Arabic and Urdu browser checks on the Navbar/About route produced `html[dir=rtl]`, the correct `lang`, and zero body/Navbar horizontal overflow at 1440×1000.
- [x] A real Arabic → Urdu `window.location.assign()` navigation reached `/ur/about`, set `museum-locale=ur`, and loaded the new document with `dir=rtl`. The old document remained visible until the new response; no intermediate blank/unlocalized client state was introduced by the selector.
- [x] Source review of marketplace grid, upload wizard, cart, and checkout found no additional clear grid/flex overflow issue after the logical-direction fixes.
- [x] TypeScript (`npx tsc --noEmit`) and ESLint (`npm run lint`) pass.

## Environment-blocked runtime checks

- [ ] Full browser rendering of the DB-backed marketplace grid could not complete because the configured database host is unreachable locally (`Prisma P1001`).
- [ ] Authenticated upload-wizard and checkout browser flows could not be loaded for the same reason; protected routes correctly redirected to localized sign-in routes.
- [ ] Logged-in DB/session persistence and a fresh-device next-login round-trip could not be completed because registration/login requires that database. Code-path verification confirms: the PUT persists `User.locale`, `useSession().update()` reloads it into the JWT, proxy fallback reads `request.auth.user.locale`, and a fresh credential login reads `User.locale` in `authorize`/the JWT callback. This still needs one integration pass against a reachable test database before merge.
- [ ] The local DB outage also forced the documented English metadata fallback, so translated initial metadata should be spot-checked against the reachable cache/provider before merge.

## Decisions and explicit follow-ups

- SEO metadata should not remain English-only: localized URLs now produce localized title/description metadata. English is only the availability fallback when translation infrastructure is down.
- The measured local Arabic → Urdu navigation was about 2.4 seconds while translation/database requests timed out. The approved lightweight overlay now makes that pending navigation explicit without delaying it beyond two animation frames needed to paint the overlay.
- Legal/license explanations, the copyright footer/Terms page, exact currency codes and prices, payment/provider identifiers, and the `ViswaRoop` overlay brand are intentionally excluded from automatic translation per product direction. Surrounding non-legal checkout UI remains translatable.
