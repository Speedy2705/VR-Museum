import type { Artifact, Collection, UploadedAsset } from "@/generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  translatePhrases: vi.fn(),
  artifactUpdate: vi.fn(),
  collectionUpdate: vi.fn(),
  uploadedAssetUpdate: vi.fn(),
}));

vi.mock("@/server/gemini-translation", () => ({
  translatePhrases: mocks.translatePhrases,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    artifact: { update: mocks.artifactUpdate },
    collection: { update: mocks.collectionUpdate },
    uploadedAsset: { update: mocks.uploadedAssetUpdate },
  },
}));

import { getLocalizedArtifact, getLocalizedCollection, getLocalizedUpload } from "./content-translation.service";
import { hashTranslationSource } from "@/lib/translation-hash";

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
  category: "History",
  translations: {},
} as unknown as Collection;

const upload = {
  id: "upload-1",
  title: "Dancing Shiva",
  category: "forged-in-time",
  metadata: {
    description: "A detailed bronze sculpture contributed by a museum community member.",
    origin: "Tamil Nadu, India",
    material: "Bronze",
  },
  translations: {
    en: {
      title: "Dancing Shiva",
      description: "A detailed bronze sculpture contributed by a museum community member.",
      origin: "Tamil Nadu, India",
      material: "Bronze",
    },
  },
} as unknown as UploadedAsset;

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

  it("regenerates a legacy translation that has no current policy hashes", async () => {
    const translated = {
      ...collection,
      translations: { es: { title: "India antigua", subtitle: "Una larga historia", description: "Objetos de toda la India", category: "Historia" } },
    } as Collection;
    mocks.translatePhrases.mockResolvedValue(["La India ancestral", "Una historia que atraviesa los siglos", "Tesoros de todos los rincones de la India", "Historia"]);
    mocks.collectionUpdate.mockImplementation(async ({ data }: { data: { translations: unknown } }) => ({ translations: data.translations }));

    const result = await getLocalizedCollection(translated, "es");

    expect(result).toMatchObject({ title: "La India ancestral", subtitle: "Una historia que atraviesa los siglos", description: "Tesoros de todos los rincones de la India" });
    expect(mocks.translatePhrases).toHaveBeenCalledWith("es", [collection.title, collection.subtitle, collection.description, collection.category]);
    expect(mocks.collectionUpdate).toHaveBeenCalledOnce();
  });

  it("regenerates only a changed field and preserves unchanged translated fields", async () => {
    const changed = {
      ...artifact,
      description: "Revised description",
      translations: {
        fr: {
          title: "Temple du Soleil",
          subtitle: "Pierre et lumière",
          description: "Ancienne description",
          _sourceHashes: {
            title: hashTranslationSource(artifact.title),
            subtitle: hashTranslationSource(artifact.subtitle),
            description: hashTranslationSource(artifact.description),
          },
        },
      },
    } as unknown as Artifact;
    mocks.translatePhrases.mockResolvedValue(["Description révisée"]);
    mocks.artifactUpdate.mockImplementation(async ({ data }: { data: { translations: unknown } }) => ({ translations: data.translations }));

    const result = await getLocalizedArtifact(changed, "fr");

    expect(mocks.translatePhrases).toHaveBeenCalledWith("fr", ["Revised description"]);
    expect(result).toMatchObject({
      title: "Temple du Soleil",
      subtitle: "Pierre et lumière",
      description: "Description révisée",
    });
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

  it("translates an upload only when it is viewed in a non-English locale and caches it", async () => {
    mocks.translatePhrases.mockResolvedValue(["Shiva dansant", "Bronze", "Tamil Nadu, Inde", "Une sculpture en bronze détaillée offerte par un membre de la communauté du musée."]);
    mocks.uploadedAssetUpdate.mockImplementation(async ({ data }: { data: { translations: unknown } }) => ({
      translations: data.translations,
    }));

    const result = await getLocalizedUpload(upload, "fr");

    expect(mocks.translatePhrases).toHaveBeenCalledWith("fr", [
      "Dancing Shiva",
      "Bronze",
      "Tamil Nadu, India",
      "A detailed bronze sculpture contributed by a museum community member.",
    ]);
    expect(mocks.uploadedAssetUpdate).toHaveBeenCalledOnce();
    expect(result.translations).toMatchObject({
      en: {
        title: "Dancing Shiva",
        description: "A detailed bronze sculpture contributed by a museum community member.",
        origin: "Tamil Nadu, India",
        material: "Bronze",
      },
      fr: {
        title: "Shiva dansant",
        material: "Bronze",
        origin: "Tamil Nadu, Inde",
        description: "Une sculpture en bronze détaillée offerte par un membre de la communauté du musée.",
      },
    });
  });

  it("falls back to the upload's English content when on-demand translation fails", async () => {
    mocks.translatePhrases.mockRejectedValue(new Error("Gemini unavailable"));

    const result = await getLocalizedUpload(upload, "de");

    expect(result.title).toBe(upload.title);
    expect(result.translations).toEqual(upload.translations);
    expect(mocks.uploadedAssetUpdate).not.toHaveBeenCalled();
  });
});
