import { afterEach, describe, expect, it, vi } from "vitest";

import { SYSTEM_INSTRUCTION, translatePhrases } from "./gemini-translation";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
});

describe("Gemini translation", () => {
  it("requests impact-preserving localization and returns only ordered translations", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ translations: ["एक जीवंत संग्रहालय, जिसकी कोई सरहद नहीं"] }) }] } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(translatePhrases("hi", ["A living museum without walls"])).resolves.toEqual([
      "एक जीवंत संग्रहालय, जिसकी कोई सरहद नहीं",
    ]);

    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(request.systemInstruction.parts[0].text).toBe(SYSTEM_INSTRUCTION);
    expect(SYSTEM_INSTRUCTION).toContain("emotional force");
    expect(SYSTEM_INSTRUCTION).toContain("not its word order");
    expect(SYSTEM_INSTRUCTION).toContain("culturally resonant equivalent");
    expect(SYSTEM_INSTRUCTION).toContain("If a phrase is already in the target language, return it unchanged");
    expect(request.contents[0].parts[0].text).toBe(JSON.stringify({
      targetLanguage: "hi",
      phrases: ["A living museum without walls"],
    }));
  });
});
