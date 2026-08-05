import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const sourceRoots = ["src/app", "src/components", "src/lib", "src/data"];
const targets = ["hi", "mr", "bn", "ta", "te", "gu", "pa", "ur", "es", "fr", "de", "ar", "zh", "ja", "ko"];
const cacheUrl = new URL("../src/translations/cache.json", import.meta.url);
const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_TRANSLATION_MODEL ?? "openai/gpt-oss-120b";

async function files(path) {
  const entries = await readdir(new URL(`../${path}/`, import.meta.url), { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const relative = join(path, entry.name).replaceAll("\\", "/");
    return entry.isDirectory() ? files(relative) : [relative];
  }));
  return nested.flat();
}

function useful(value) {
  const phrase = value.replace(/\s+/g, " ").trim();
  if (phrase.length < 2 || phrase.length > 500 || !/[A-Za-z]/.test(phrase)) return null;
  if (/^(https?:|\/|@\/|[.#][\w-]|[\w-]+\.[a-z]{2,4}$)/i.test(phrase)) return null;
  if (/^[\w:/.[\]{}()*+?|'"`$=-]+$/.test(phrase)) return null;
  if (/\b(?:mt|mb|ml|mr|px|py|pt|pb|text|bg|border|flex|grid|block|hidden|items|justify|gap|space|w|h|min|max|sm|md|lg|xl|hover|focus|disabled)-/.test(phrase)) return null;
  return phrase;
}

async function extract() {
  const phrases = new Set();
  const paths = (await Promise.all(sourceRoots.map(files))).flat()
    .filter((path) => [".ts", ".tsx"].includes(extname(path)));
  for (const path of paths) {
    const text = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    for (const match of text.matchAll(/>([^<>{}\n]*[A-Za-z][^<>{}\n]*)</g)) {
      const phrase = useful(match[1]);
      if (phrase) phrases.add(phrase);
    }
    for (const match of text.matchAll(/(?:label|title|description|placeholder|subtitle|message|alt)=?[{]?\s*["`]([^"`{}]*[A-Za-z][^"`{}]*)["`]/g)) {
      const phrase = useful(match[1]);
      if (phrase) phrases.add(phrase);
    }
    for (const match of text.matchAll(/["`]([^"`{}\n]*\s+[^"`{}\n]*[A-Za-z][^"`{}\n]*)["`]/g)) {
      const phrase = useful(match[1]);
      if (phrase) phrases.add(phrase);
    }
  }
  return [...phrases].sort((a, b) => a.localeCompare(b));
}

async function translateBatch(phrases, target) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      reasoning_effort: "low",
      max_completion_tokens: 12000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translation_batch",
          strict: true,
          schema: {
            type: "object",
            properties: {
              translations: {
                type: "array",
                items: { type: "string" },
                minItems: phrases.length,
                maxItems: phrases.length,
              },
            },
            required: ["translations"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        { role: "system", content: "You are a professional museum website translator. Translate accurately and naturally. Preserve brand names, URLs, file extensions, placeholders, interpolation tokens, punctuation, and HTML entities. Return only valid JSON with one key named translations whose value is an array of strings in exactly the input order. Never add explanations." },
        { role: "user", content: JSON.stringify({ sourceLanguage: "en", targetLanguage: target, phrases }) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Groq translation failed for ${target}: ${response.status} ${await response.text()}`);
  const body = await response.json();
  const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
  if (!Array.isArray(parsed.translations) || parsed.translations.length !== phrases.length || parsed.translations.some((item) => typeof item !== "string" || !item.trim())) {
    const received = Array.isArray(parsed.translations) ? parsed.translations.length : typeof parsed.translations;
    throw new Error(`Groq returned an invalid translation batch for ${target}: expected ${phrases.length}, received ${received}`);
  }
  return parsed.translations;
}

const phrases = await extract();
const cache = JSON.parse(await readFile(cacheUrl, "utf8"));
cache.en = Object.fromEntries(phrases.map((phrase) => [phrase, phrase]));
if (!apiKey) {
  await writeFile(cacheUrl, `${JSON.stringify(cache, null, 2)}\n`);
  throw new Error("GROQ_API_KEY is required. English phrases were extracted; no API calls were made.");
}
for (const target of targets) {
  cache[target] ??= {};
  const missing = phrases.filter((phrase) => !cache[target][phrase]);
  for (let index = 0; index < missing.length; index += 30) {
    const batch = missing.slice(index, index + 30);
    const translated = await translateBatch(batch, target);
    batch.forEach((phrase, offset) => { cache[target][phrase] = translated[offset]; });
    await writeFile(cacheUrl, `${JSON.stringify(cache, null, 2)}\n`);
    process.stdout.write(`${target}: ${Math.min(index + batch.length, missing.length)}/${missing.length}\n`);
  }
}
await writeFile(cacheUrl, `${JSON.stringify(cache, null, 2)}\n`);
process.stdout.write(`Cached ${phrases.length} phrases across ${targets.length + 1} languages.\n`);
