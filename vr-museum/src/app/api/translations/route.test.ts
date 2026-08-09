import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  createMany: vi.fn(),
  translatePhrases: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    translationCache: {
      findMany: mocks.findMany,
      createMany: mocks.createMany,
    },
  },
}));

vi.mock("@/server/gemini-translation", () => {
  class GeminiTranslationError extends Error {
    constructor(readonly code: string) {
      super(code);
      this.name = "GeminiTranslationError";
    }
  }
  return { GeminiTranslationError, translatePhrases: mocks.translatePhrases };
});

import { resetRateLimits } from "@/lib/rate-limit";
import { hashTranslationSource, legacyTranslationSourceHash, normalizeTranslationSource } from "@/lib/translation-hash";
import { GeminiTranslationError } from "@/server/gemini-translation";
import { POST } from "./route";

function request(phrases: string[], ip = "10.0.0.50") {
  return new Request("http://localhost/api/translations", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ locale: "fr", phrases }),
  });
}

beforeEach(() => {
  resetRateLimits();
  vi.resetAllMocks();
  mocks.findMany.mockResolvedValue([]);
  mocks.createMany.mockResolvedValue({ count: 0 });
});

describe("POST /api/translations", () => {
  it("returns a complete Postgres cache hit without calling Gemini", async () => {
    const phrase = "Explore the collection";
    mocks.findMany.mockResolvedValue([{
      sourceHash: hashTranslationSource(phrase),
      translatedText: "Explorer la collection",
    }]);

    const response = await POST(request([phrase]));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { translations: { [phrase]: "Explorer la collection" } },
    });
    expect(mocks.translatePhrases).not.toHaveBeenCalled();
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it("translates a cache miss and persists the generated row", async () => {
    const phrase = "Enter the virtual museum";
    mocks.translatePhrases.mockResolvedValue(["Entrez dans le musée virtuel"]);

    const response = await POST(request([phrase]));

    expect(response.status).toBe(200);
    expect(mocks.translatePhrases).toHaveBeenCalledWith("fr", [normalizeTranslationSource(phrase)]);
    expect(mocks.createMany).toHaveBeenCalledWith({
      data: [{
        locale: "fr",
        sourceHash: hashTranslationSource(phrase),
        sourceText: normalizeTranslationSource(phrase),
        translatedText: "Entrez dans le musée virtuel",
      }],
      skipDuplicates: true,
    });
    expect(await response.json()).toMatchObject({
      data: { translations: { [phrase]: "Entrez dans le musée virtuel" } },
    });
  });

  it("sends only missing phrases to Gemini on a partial cache hit", async () => {
    const cached = "Collections";
    const missing = "Marketplace";
    mocks.findMany.mockResolvedValue([{
      sourceHash: hashTranslationSource(cached),
      translatedText: "Collections",
    }]);
    mocks.translatePhrases.mockResolvedValue(["Marché"]);

    const response = await POST(request([cached, missing]));
    const body = await response.json();

    expect(mocks.translatePhrases).toHaveBeenCalledWith("fr", [normalizeTranslationSource(missing)]);
    expect(mocks.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({ sourceHash: hashTranslationSource(missing), translatedText: "Marché" })],
    }));
    expect(body.data.translations).toEqual({ Collections: "Collections", Marketplace: "Marché" });
  });

  it("reuses and migrates an exact legacy cache row without calling Gemini", async () => {
    const phrase = "About ViswaRoop";
    mocks.findMany.mockResolvedValue([{
      sourceHash: legacyTranslationSourceHash(phrase),
      sourceText: phrase,
      translatedText: "À propos de ViswaRoop",
    }]);

    const response = await POST(request([phrase]));

    expect(response.status).toBe(200);
    expect(mocks.translatePhrases).not.toHaveBeenCalled();
    expect(mocks.createMany).toHaveBeenCalledWith({
      data: [{
        locale: "fr",
        sourceHash: hashTranslationSource(phrase),
        sourceText: phrase,
        translatedText: "À propos de ViswaRoop",
      }],
      skipDuplicates: true,
    });
  });

  it("does not reuse a legacy row when only the source casing matches", async () => {
    const phrase = "ABOUT";
    mocks.findMany.mockResolvedValue([{
      sourceHash: legacyTranslationSourceHash(phrase),
      sourceText: "About",
      translatedText: "À propos",
    }]);
    mocks.translatePhrases.mockResolvedValue(["À PROPOS"]);

    await POST(request([phrase]));

    expect(mocks.translatePhrases).toHaveBeenCalledWith("fr", [phrase]);
  });

  it("returns a clean error for malformed Gemini output without writing partial cache rows", async () => {
    mocks.translatePhrases.mockRejectedValue(new GeminiTranslationError("INVALID_RESPONSE"));

    const response = await POST(request(["About", "Support"]));

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      success: false,
      error: { message: "Gemini returned an invalid translation" },
    });
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it("rate-limits the sixth request from the same identity", async () => {
    mocks.findMany.mockResolvedValue([{
      sourceHash: hashTranslationSource("About"),
      translatedText: "À propos",
    }]);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await POST(request(["About"], "10.0.0.99"))).status).toBe(200);
    }

    const response = await POST(request(["About"], "10.0.0.99"));

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ success: false, error: { message: "Too many translation requests" } });
    expect(mocks.findMany).toHaveBeenCalledTimes(5);
  });
});
