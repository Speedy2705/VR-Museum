import type { Artifact, Collection } from "@/generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  translatePhrases: vi.fn(),
  artifactUpdate: vi.fn(),
  collectionUpdate: vi.fn(),
}));

vi.mock("@/server/gemini-translation", () => ({
  translatePhrases: mocks.translatePhrases,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    artifact: { update: mocks.artifactUpdate },
    collection: { update: mocks.collectionUpdate },
  },
}));

import { getLocalizedArtifact, getLocalizedCollection } from "./content-translation.service";

const artifact = {
  id: "artifact-1",
  title: "Sun Temple",
  subtitle: "Stone and light",
  description: "Built in the 13th century",
  translations: { fr: { title: "Temple du Soleil", subtitle: "Pierre et lumière", description: "Construit au XIIIe siècle" } },
} as unknown as Artifact;

const collection = {
  id: "collection-1",
  title: "Ancient India",
  subtitle: "A long history",
  description: "Objects from across India",
  translations: {},
} as unknown as Collection;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("content translation service", () => {
  it("calls Gemini for a missing artifact locale, merges it, and persists once", async () => {
    mocks.translatePhrases.mockResolvedValue(["सूर्य मंदिर", "पत्थर और प्रकाश", "13वीं शताब्दी में निर्मित"]);
    mocks.artifactUpdate.mockImplementation(async ({ data }: { data: { translations: unknown } }) => ({
      ...artifact,
      translations: data.translations,
    }));

    const result = await getLocalizedArtifact(artifact, "hi");

    expect(mocks.translatePhrases).toHaveBeenCalledWith("hi", [artifact.title, artifact.subtitle, artifact.description]);
    expect(mocks.artifactUpdate).toHaveBeenCalledOnce();
    expect(mocks.artifactUpdate.mock.calls[0][0]).toMatchObject({
      where: { id: artifact.id },
      data: {
        translations: {
          fr: { title: "Temple du Soleil", subtitle: "Pierre et lumière", description: "Construit au XIIIe siècle" },
          hi: { title: "सूर्य मंदिर", subtitle: "पत्थर और प्रकाश", description: "13वीं शताब्दी में निर्मित" },
        },
      },
    });
    expect(result).toMatchObject({ title: "सूर्य मंदिर", subtitle: "पत्थर और प्रकाश", description: "13वीं शताब्दी में निर्मित" });
  });

  it("returns an existing complete collection locale without Gemini or a write", async () => {
    const translated = {
      ...collection,
      translations: { es: { title: "India antigua", subtitle: "Una larga historia", description: "Objetos de toda la India" } },
    } as Collection;

    const result = await getLocalizedCollection(translated, "es");

    expect(result).toMatchObject({ title: "India antigua", subtitle: "Una larga historia", description: "Objetos de toda la India" });
    expect(mocks.translatePhrases).not.toHaveBeenCalled();
    expect(mocks.collectionUpdate).not.toHaveBeenCalled();
  });

  it("falls back to English without caching or clobbering existing locales when Gemini fails", async () => {
    mocks.translatePhrases.mockRejectedValue(new Error("Gemini request failed"));

    const result = await getLocalizedArtifact(artifact, "de");

    expect(result).toMatchObject({ title: artifact.title, subtitle: artifact.subtitle, description: artifact.description });
    expect(mocks.artifactUpdate).not.toHaveBeenCalled();
    expect(artifact.translations).toEqual({
      fr: { title: "Temple du Soleil", subtitle: "Pierre et lumière", description: "Construit au XIIIe siècle" },
    });
  });

  it("returns English without Gemini for the English locale", async () => {
    const result = await getLocalizedArtifact(artifact, "en");

    expect(result).toMatchObject({ title: artifact.title, subtitle: artifact.subtitle, description: artifact.description });
    expect(mocks.translatePhrases).not.toHaveBeenCalled();
    expect(mocks.artifactUpdate).not.toHaveBeenCalled();
  });
});
