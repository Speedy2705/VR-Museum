# Runtime multilingual translation

The locale in the URL and the language selector are managed by
`src/lib/i18n.ts`. All visible English UI copy is translated at runtime by the
server-only `POST /api/translations` endpoint using Gemini Flash-Lite.

## Configuration

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Add these values to `.env.local` locally and to the deployment environment:

   ```text
   GEMINI_API_KEY=your-key
   GEMINI_TRANSLATION_MODEL=gemini-3.5-flash-lite
   ```

3. Restart the development server after changing environment variables.

The browser sends visible English phrases in bounded batches. The API key
remains on the server. `TranslationCache` rows in PostgreSQL are the durable
source of truth, keyed by locale and normalized-source hash; browser local
storage is only the fast per-device layer. A server restart therefore does not
spend Gemini quota again for phrases already stored in PostgreSQL.

Artifact and collection translations are stored in each record's
`translations` JSON field. Locale-aware view models read those values directly;
Gemini fills and persists only a missing locale without replacing other locale
objects. The native language names and locale codes remain static because they
are language identifiers rather than translatable page copy.

For a durability check, load a non-English locale once, confirm rows exist in
`TranslationCache`, restart the app, clear browser local storage, and reload the
same page. The page should use the PostgreSQL cache without a Gemini request.
