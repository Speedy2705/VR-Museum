# Runtime multilingual translation

Last verified against the locale, translation API, and caching implementation on 2026-08-09.

Localized URL routing and the language selector are defined by `src/lib/i18n.ts` and `src/proxy.ts`. English UI phrases are translated through the server-only `POST /api/translations` endpoint using the configured Gemini model.

## Supported locales

`en`, `hi`, `mr`, `bn`, `ta`, `te`, `gu`, `pa`, `ur`, `es`, `fr`, `de`, `ar`, `zh`, `ja`, and `ko` are supported. Arabic and Urdu use RTL document direction; all other supported locales use LTR.

Unprefixed page requests redirect to the locale selected from the URL, `museum-locale` cookie, signed-in user profile, or English default. A successful signed-in language change persists `User.locale` and refreshes the Auth.js session.

## Configuration

1. Create a key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Add server-only values locally and in the deployment environment:

   ```dotenv
   GEMINI_API_KEY="your-key"
   GEMINI_TRANSLATION_MODEL="gemini-3.5-flash-lite"
   ```

3. Restart the application after changing environment variables.

Never give the Gemini key a `NEXT_PUBLIC_` prefix.

## Caching and content

The browser sends visible English phrases in bounded batches. PostgreSQL `TranslationCache` rows are the durable source of truth, keyed by locale and a case-sensitive hash of normalized English source text; browser local storage is only a per-device fast layer. Cached phrases therefore survive a server restart.

On every language visit, the server divides content into cache hits and misses. Only missing or changed source phrases are sent to Gemini. A changed phrase receives a new source hash, while every unchanged phrase continues using its existing database translation. Legacy case-insensitive cache keys are reused only when their stored English source matches exactly, then migrated to the current key format without another Gemini call.

Artifact, collection, and uploaded-asset translations live in each record's `translations` JSON. Each locale stores per-field source hashes alongside its translated values. Changing only a description therefore regenerates only that description; saved title, subtitle, category, material, and origin translations remain untouched. Older records are source-stamped on their first localized read without regenerating complete existing translations. Elements marked `data-no-translate` prevent already-localized database content from being translated twice.

Native language names, legal/license text, exact prices and currency codes, provider identifiers, and the ViswaRoop brand are intentionally excluded. If Gemini or PostgreSQL is unavailable, pages fall back to English rather than failing.

## Durability check

1. Load a non-English locale and confirm successful translation responses and new cache rows.
2. Reload and confirm cached phrases do not trigger another Gemini request.
3. Restart the server and clear browser local storage.
4. Reload and confirm PostgreSQL serves the same translations.
5. Sign in from a fresh browser context and confirm the saved user locale is restored.

See [MULTILINGUAL_COVERAGE_AUDIT.md](MULTILINGUAL_COVERAGE_AUDIT.md) for implementation coverage and [FINAL_QA.md](FINAL_QA.md) for release checks.
