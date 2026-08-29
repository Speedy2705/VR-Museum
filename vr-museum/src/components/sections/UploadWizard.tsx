"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { notifyError } from "@/lib/client-error";
import { museumToast } from "@/lib/museum-toast";
import LightingPresetPicker from "@/components/media/LightingPresetPicker";
import LightingStudioViewer from "@/components/media/LightingStudioViewer";
import ArtifactStageFullscreen from "@/components/media/ArtifactStageFullscreen";
import {
  ARTIFACT_CATEGORIES,
  getCategoryByKey,
  getDefaultLightingForCategory,
  getDefaultTemperatureForCategory,
  getDefaultDirectionForCategory,
  getExhibitDisplayStyle,
  type CollectionSlug,
  type LightTemperatureKey,
  type LightDirectionKey,
  type LightingPresetKey,
} from "@/lib/artifact-categories";
import { getLightDirection, getLightTemperature } from "@/lib/lighting-presets";
import {
  ALLOWED_MODEL_EXTENSIONS,
  ALLOWED_VIDEO_EXTENSIONS,
  MAX_MODEL_FILE_SIZE_LABEL,
  MAX_VIDEO_FILE_SIZE_LABEL,
  MODEL_FILE_ACCEPT,
  VIDEO_FILE_ACCEPT,
  extensionOf,
  modelFormatFromExtension,
  validateUploadFile,
} from "@/lib/upload-file-policy";
import { uploadMediaDirect } from "@/lib/blob-upload.client";

type ArtifactType = "3d-model" | "video-scan" | "image-to-3d";
type SourceView = "front" | "side" | "back";
type PriceMode = "free" | "paid";

const categoryDescriptions: Record<CollectionSlug, string> = {
  "veins-of-marble": "Carved marble sculptures and timeless decorative works",
  "forged-in-time": "Metal artifacts, ritual objects, ornaments, and historic craftsmanship",
  "stories-in-color": "Paintings and textiles preserving culture through colour, pattern, surface, and story",
  "echoes-in-stone": "Carved stone sculptures, inscriptions, and weathered fragments",
  "earth-and-ember": "Red-clay pottery, terracotta figures, and hand-shaped earthen works",
  "community-uploads": "Artifacts beyond the five galleries, shared for public discovery",
};

const primaryMaterialByDomain: Record<Exclude<CollectionSlug, "community-uploads">, string> = {
  "veins-of-marble": "Marble",
  "forged-in-time": "Metal",
  "stories-in-color": "Paint and pigment",
  "echoes-in-stone": "Stone",
  "earth-and-ember": "Terracotta / red clay",
};

const materialOptions = ["Marble", "Metal", "Paint and pigment", "Stone", "Terracotta / red clay", "Ceramic", "Glass", "Wood", "Textile", "Bone or ivory"] as const;

const typeOptions: {
  key: ArtifactType;
  name: string;
  desc: string;
  formats: string;
}[] = [
  {
    key: "3d-model",
    name: "3D Model File",
    desc: "Upload from 3D scanning or modeling software",
    formats: ALLOWED_MODEL_EXTENSIONS.join(" "),
  },
  {
    key: "video-scan",
    name: "Video Scan",
    desc: "Upload a turntable, walkthrough, or photogrammetry source video",
    formats: ALLOWED_VIDEO_EXTENSIONS.join(" "),
  },
  {
    key: "image-to-3d",
    name: "Create 3D from Images",
    desc: "Create a textured 3D model with Meshy from front, side, and back views",
    formats: "3 JPG, PNG, or WEBP images",
  },
];

const licenseOptions = [
  {
    key: "cc0",
    name: "CC0 — Public Domain",
    desc: "No rights reserved. Anyone may use, remix, or sell without attribution.",
  },
  {
    key: "cc-by",
    name: "CC-BY 4.0",
    desc: "Free to use with credit. Must attribute the original creator.",
  },
  {
    key: "cc-by-sa",
    name: "CC-BY-SA 4.0",
    desc: "Free with credit. Derivatives must use the same license.",
  },
  {
    key: "personal",
    name: "Personal Use Only",
    desc: "Buyer may use for personal, non-commercial purposes only.",
  },
  {
    key: "commercial",
    name: "Commercial Use",
    desc: "Buyer may use in commercial projects with a single-use license.",
  },
];

const steps = [
  { key: 1, label: "Choose Type" },
  { key: 2, label: "Domain" },
  { key: 3, label: "Upload & Light" },
  { key: 4, label: "Details" },
  { key: 5, label: "Review" },
];

export default function UploadWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const reduceMotion = useReducedMotion();

  const [type, setType] = useState<ArtifactType | null>(null);
  const [category, setCategory] = useState<CollectionSlug | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileUrlRef = useRef<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [rejectedFile, setRejectedFile] = useState<{ name: string; reason: string } | null>(null);
  const [sourceImages, setSourceImages] = useState<Partial<Record<SourceView, File>>>({});
  const [generationProgress, setGenerationProgress] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState("");
  const [material, setMaterial] = useState("");
  const [materialChoice, setMaterialChoice] = useState("");
  const [lighting, setLighting] = useState<LightingPresetKey | null>(null);
  const [lightTemperature, setLightTemperature] = useState<LightTemperatureKey | null>(null);
  const [lightDirection, setLightDirection] = useState<LightDirectionKey | null>(null);
  const [priceMode, setPriceMode] = useState<PriceMode>("free");
  const [price, setPrice] = useState("0.00");
  const [license, setLicense] = useState(licenseOptions[0].key);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedLicense = licenseOptions.find((l) => l.key === license);
  const selectedType = typeOptions.find((option) => option.key === type);
  const selectedCategory = category ? getCategoryByKey(category) : undefined;
  const modelFormat = file ? modelFormatFromExtension(extensionOf(file.name)) : null;
  const isModelType = type === "3d-model" || type === "image-to-3d";
  useEffect(() => {
    return () => {
      if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    };
  }, []);

  function updateFile(nextFile: File | null) {
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    const nextUrl = nextFile ? URL.createObjectURL(nextFile) : null;
    fileUrlRef.current = nextUrl;
    setFile(nextFile);
    setFileUrl(nextUrl);
  }
  const acceptedExtensions =
    type === "video-scan" ? ALLOWED_VIDEO_EXTENSIONS : ALLOWED_MODEL_EXTENSIONS;
  const acceptedFiles = type === "video-scan" ? VIDEO_FILE_ACCEPT : MODEL_FILE_ACCEPT;
  const maxFileSizeLabel =
    type === "video-scan" ? MAX_VIDEO_FILE_SIZE_LABEL : MAX_MODEL_FILE_SIZE_LABEL;

  const canReview = name.trim().length > 0 && material.trim().length > 0 && origin.trim().length > 0 && description.trim().length >= 40 && file !== null && photo !== null && category !== null && (!isModelType || (lightTemperature !== null && lightDirection !== null));
  const canContinueFromStudio = file !== null && (!isModelType || (modelFormat !== null && lightTemperature !== null && lightDirection !== null));

  async function generateModel() {
    const views: SourceView[] = ["front", "side", "back"];
    if (views.some((view) => !sourceImages[view])) {
      museumToast.warning("Three views are required", "Add front, side, and back images of the same object.");
      return;
    }
    setGenerating(true);
    setGenerationProgress(0);
    setError("");
    try {
      const form = new FormData();
      views.forEach((view) => form.set(view, sourceImages[view]!));
      const startedResponse = await fetch("/api/meshy/multi-image", { method: "POST", body: form });
      const started = await startedResponse.json() as { success: boolean; data?: { taskId: string }; error?: { message: string } };
      if (!started.success || !started.data?.taskId) throw new Error(started.error?.message ?? "Could not start 3D generation");
      const taskId = started.data.taskId;
      for (let attempt = 0; attempt < 180; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
        const statusResponse = await fetch(`/api/meshy/multi-image/${encodeURIComponent(taskId)}`, { cache: "no-store" });
        const statusBody = await statusResponse.json() as { success: boolean; data?: { status: string; progress: number; error: string | null }; error?: { message: string } };
        if (!statusBody.success || !statusBody.data) throw new Error(statusBody.error?.message ?? "Could not check generation status");
        setGenerationProgress(statusBody.data.progress);
        if (statusBody.data.status === "FAILED" || statusBody.data.status === "CANCELED") throw new Error(statusBody.data.error ?? "Meshy could not generate this model");
        if (statusBody.data.status !== "SUCCEEDED") continue;
        const download = await fetch(`/api/meshy/multi-image/${encodeURIComponent(taskId)}/download`);
        if (!download.ok) throw new Error("The generated model could not be downloaded");
        const generated = new File([await download.blob()], `meshy-${taskId}.glb`, { type: "model/gltf-binary" });
        updateFile(generated);
        setFileName(generated.name);
        setGenerationProgress(100);
        museumToast.success("3D model created", "Review the generated model and choose its museum lighting.");
        return;
      }
      throw new Error("Meshy generation timed out. Please try again.");
    } catch (generationError) {
      setError(notifyError(generationError, "3D generation failed. Please try different images."));
    } finally {
      setGenerating(false);
    }
  }

  async function submitUpload() {
    if (!file || !photo || !type || !category || (isModelType && (!lightTemperature || !lightDirection))) {
      museumToast.warning("Upload details are incomplete", "Choose an artifact file and a display photo before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("photo", photo);
    form.set("title", name);
    form.set("description", description);
    form.set("category", category ?? "");
    form.set("material", material);
    form.set("type", type);
    form.set("origin", origin);
    if (isModelType && lighting) form.set("lighting", lighting);
    if (isModelType && lightTemperature && lightDirection) { form.set("lightTemperature", lightTemperature); form.set("lightDirection", lightDirection); }
    form.set("price", priceMode === "paid" ? price : "");
    form.set("license", license);
    const localizedContent = { en: { title: name, description, origin, material } };
    form.set("translations", JSON.stringify(localizedContent));

    try {
      if (process.env.NEXT_PUBLIC_BLOB_UPLOADS === "true" || process.env.NEXT_PUBLIC_STORAGE_PROVIDER === "backblaze-b2") {
        const [stored, storedPhoto] = await Promise.all([
          uploadMediaDirect(file),
          uploadMediaDirect(photo),
        ]);
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: name,
            description,
            category,
            fileUrl: stored.url,
            thumbnailUrl: storedPhoto.url,
            mediaType: type === "video-scan" ? "VIDEO" : "MODEL_3D",
            modelFormat: isModelType ? modelFormat : null,
            lightingPreset: isModelType ? lighting : null,
            lightTemperature: isModelType ? lightTemperature : null,
            lightDirection: isModelType ? lightDirection : null,
            metadata: {
              type,
              origin,
              material,
              price: priceMode === "paid" ? Number(price) : null,
              license,
              description,
              originalFilename: file.name,
              storedFilename: stored.pathname,
              contentType: file.type,
              size: file.size,
              displayPhotoFilename: storedPhoto.pathname,
            },
            translations: localizedContent,
          }),
        });
        const body = (await response.json()) as {
          success: boolean;
          data?: { id: string };
          error?: { message: string };
        };
        if (!body.success) throw new Error(body.error?.message ?? "Upload failed");
        museumToast.success("Upload submitted", "Your artifact has been sent to the moderation queue.");
        router.push(`/assets?uploadId=${encodeURIComponent(body.data?.id ?? "")}`);
        router.refresh();
        return;
      }
      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const body = (await response.json()) as {
        success: boolean;
        data?: { id: string };
        error?: { message: string };
      };
      if (!body.success) {
        throw new Error(body.error?.message ?? "Upload failed");
      }
      museumToast.success("Upload submitted", "Your artifact has been sent to the moderation queue.");
      router.push(`/assets?uploadId=${encodeURIComponent(body.data?.id ?? "")}`);
      router.refresh();
    } catch (uploadError) {
      setError(notifyError(uploadError, "Upload failed. Please try again."));
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-cream px-6 py-14 md:px-10">
      <div className={`mx-auto transition-[max-width] duration-300 ${step === 3 ? "max-w-6xl" : "max-w-2xl"}`}>
        <div className="flex items-center gap-3">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3">
              <button
                type="button"
                disabled={s.key > step}
                onClick={() => setStep(s.key)}
                aria-current={step === s.key ? "step" : undefined}
                className="flex items-center gap-1.5 disabled:cursor-not-allowed"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    step === s.key
                      ? "bg-ink text-cream"
                      : step > s.key
                        ? "bg-charcoal/20 text-charcoal"
                        : "border border-line text-stone"
                  }`}
                >
                  {s.key}
                </span>
                <span
                  className={`text-[10px] tracking-label uppercase ${
                    step === s.key ? "text-ink" : "text-stone"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span className="h-px w-6 bg-line" aria-hidden />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 h-px overflow-hidden bg-line">
          <motion.div
            className="h-full bg-ink"
            initial={false}
            animate={{ width: `${(step / steps.length) * 100}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
        {/* Step 1 — Choose Type */}
        {step === 1 && (
          <motion.div
            key="choose-type"
            initial={reduceMotion ? false : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            className="mt-8"
          >
            <p className="text-sm text-stone">What are you contributing?</p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {typeOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    if (type !== opt.key) {
                      updateFile(null);
                      setFileName(null);
                      setRejectedFile(null);
                    }
                    setType(opt.key);
                    if (opt.key !== "video-scan" && category) { setLighting(getDefaultLightingForCategory(category)); setLightTemperature(getDefaultTemperatureForCategory(category)); setLightDirection(getDefaultDirectionForCategory(category)); }
                  }}
                  className={`border px-5 py-5 text-start transition-colors ${
                    type === opt.key
                      ? "border-ink bg-cream-dark"
                      : "border-line hover:border-stone"
                  }`}
                >
                  <p className="text-sm text-ink">{opt.name}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone">
                    {opt.desc}
                  </p>
                  <p className="mt-3 text-[10px] tracking-label text-stone-light uppercase">
                    {opt.formats}
                  </p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                if (!type) {
                  museumToast.warning("Choose an upload type", "Select a 3D model, three-view generation, or video scan to continue.");
                  return;
                }
                setStep(2);
              }}
              className={`mt-8 w-full py-3.5 text-[11px] tracking-label uppercase transition-colors ${
                type
                  ? "bg-ink text-cream hover:bg-charcoal"
                  : "cursor-not-allowed bg-cream-dark text-stone-light"
              }`}
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Step 2 — Category */}
        {step === 2 && (
          <motion.div
            key="category"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            className="mt-8"
          >
            <p className="text-sm text-stone">Which collection best fits this artifact?</p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ARTIFACT_CATEGORIES.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setCategory(opt.key);
                    const suggestedMaterial = opt.key === "community-uploads" ? "" : primaryMaterialByDomain[opt.key];
                    setMaterialChoice(suggestedMaterial);
                    setMaterial(suggestedMaterial);
                    if (type !== "video-scan") { setLighting(getDefaultLightingForCategory(opt.key)); setLightTemperature(getDefaultTemperatureForCategory(opt.key)); setLightDirection(getDefaultDirectionForCategory(opt.key)); }
                  }}
                  className={`border px-5 py-5 text-start transition-colors ${
                    category === opt.key ? "border-ink bg-cream-dark" : "border-line hover:border-stone"
                  }`}
                >
                  <p className="text-sm text-ink">{opt.name}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone">{categoryDescriptions[opt.key]}</p>
                </button>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="border border-line px-6 py-3.5 text-[11px] tracking-label text-ink uppercase hover:bg-black/5">Back</button>
              <button
                type="button"
                onClick={() => {
                  if (!category) {
                    museumToast.warning("Choose a category", "Select the collection that best fits your artifact.");
                    return;
                  }
                  setStep(3);
                }}
                className={`flex-1 py-3.5 text-[11px] tracking-label uppercase transition-colors ${category ? "bg-ink text-cream hover:bg-charcoal" : "cursor-not-allowed bg-cream-dark text-stone-light"}`}
              >Continue</button>
            </div>
          </motion.div>
        )}

        {/* Steps 3–4 — media studio, then artifact details */}
        {(step === 3 || step === 4) && (
          <motion.div
            key="details"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            className="mt-8"
          >
            {step === 3 && <>
            {type !== "image-to-3d" && <label className="block cursor-pointer border border-dashed border-line px-6 py-14 text-center hover:border-stone">
              <input
                type="file"
                accept={acceptedFiles}
                className="hidden"
                onChange={async (event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setRejectedFile(null);
                  if (!selected) {
                    updateFile(null);
                    setFileName(null);
                    return;
                  }
                  const validation = await validateUploadFile(
                    selected,
                    type ?? "3d-model",
                  );
                  if (!validation.valid) {
                    updateFile(null);
                    setFileName(null);
                    setRejectedFile({ name: selected.name, reason: validation.reason });
                    museumToast.error("File rejected", validation.reason);
                    event.target.value = "";
                    return;
                  }
                  updateFile(selected);
                  setFileName(selected.name);
                }}
              />
              <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-line text-stone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 16V4m0 0 4 4m-4-4L8 8M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="mt-3 text-sm text-ink">
                {fileName ?? `Drop your ${type === "video-scan" ? "video scan" : "3D model"} here`}
              </p>
              <p className="mt-1 text-xs text-stone-light">
                {fileName ? "Click to choose a different file" : "or click to browse"}
              </p>
              <p className="mt-3 text-[10px] tracking-label text-stone uppercase">
                Accepted: {acceptedExtensions.join(", ")} — max {maxFileSizeLabel}
              </p>
            </label>}
            {type === "image-to-3d" && (
              <div className="border border-line bg-cream-dark/40 p-5">
                <div>
                  <p className="text-[10px] tracking-label text-stone uppercase">Meshy three-view capture</p>
                  <h2 className="font-display mt-2 text-2xl italic text-ink">Show the same object from three sides</h2>
                  <p className="mt-2 text-xs leading-relaxed text-stone">Use a plain background, even lighting, and keep the object at a similar scale in every frame.</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {(["front", "side", "back"] as SourceView[]).map((view) => (
                    <label key={view} className="cursor-pointer border border-dashed border-line bg-cream px-4 py-6 text-center hover:border-stone">
                      <span className="text-[10px] tracking-label text-stone uppercase">{view} view</span>
                      <span className="mt-2 block truncate text-xs text-ink">{sourceImages[view]?.name ?? "Choose image"}</span>
                      <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(event) => {
                        const selected = event.target.files?.[0];
                        if (!selected) return;
                        if (!new Set(["image/jpeg", "image/png"]).has(selected.type) || !selected.size || selected.size > 10 * 1024 * 1024) {
                          museumToast.error("Image rejected", "Each source image must be a JPG or PNG no larger than 10 MB.");
                          event.target.value = "";
                          return;
                        }
                        setSourceImages((current) => ({ ...current, [view]: selected }));
                        updateFile(null);
                        setFileName(null);
                        setGenerationProgress(null);
                      }} />
                    </label>
                  ))}
                </div>
                <button type="button" onClick={generateModel} disabled={generating || (["front", "side", "back"] as SourceView[]).some((view) => !sourceImages[view])} className="mt-5 w-full bg-ink px-5 py-3.5 text-[11px] tracking-label text-cream uppercase disabled:cursor-not-allowed disabled:opacity-40">
                  {generating ? `Generating model${generationProgress !== null ? ` · ${generationProgress}%` : "…"}` : file ? "Regenerate 3D Model" : "Generate 3D Model with Meshy"}
                </button>
                {generating && <p className="mt-3 text-center text-xs text-stone">Meshy generation can take several minutes. Keep this page open.</p>}
              </div>
            )}
            {rejectedFile && (
              <div role="alert" className="mt-4 border border-red-900/25 bg-red-950/5 px-5 py-4">
                <p className="text-xs font-medium text-red-900">{rejectedFile.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-red-800">{rejectedFile.reason}</p>
              </div>
            )}

            {isModelType && fileUrl && modelFormat && lightTemperature && lightDirection && (
              <div className="mt-6">
                <ArtifactStageFullscreen
                  studioSplit
                  overlayLabel="Upload lighting controls"
                  viewer={<LightingStudioViewer src={fileUrl} format={modelFormat} lightTemperature={lightTemperature} lightDirection={lightDirection} title={name || fileName || "Uploaded artifact"} displayStyle={getExhibitDisplayStyle(category, material)} />}
                  overlay={<div><p className="text-[9px] tracking-label text-stone uppercase">Step 3 of 5 · Lighting Studio</p><h2 className="font-display mt-3 text-3xl italic">Shape the viewing light</h2><p className="mt-2 text-xs leading-relaxed text-stone">Changes appear immediately in the 3D exhibit on the left.</p><div className="mt-6"><LightingPresetPicker stepped temperature={lightTemperature} direction={lightDirection} onTemperatureChange={setLightTemperature} onDirectionChange={setLightDirection} suggestedTemperature={category ? getDefaultTemperatureForCategory(category) : undefined} /></div></div>}
                />
              </div>
            )}
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="border border-line px-6 py-3.5 text-[11px] tracking-label text-ink uppercase hover:bg-black/5">Back</button>
              <button type="button" onClick={() => { if (!canContinueFromStudio) { museumToast.warning("Media is incomplete", "Upload a valid artifact file and choose its lighting before continuing."); return; } setStep(4); }} className={`flex-1 py-3.5 text-[11px] tracking-label uppercase ${canContinueFromStudio ? "bg-ink text-cream hover:bg-charcoal" : "cursor-not-allowed bg-cream-dark text-stone-light"}`}>Continue to Details</button>
            </div>
            </>}
            {step === 4 && <>
            <div className="mb-7"><p className="text-[10px] tracking-label text-stone uppercase">Step 4 of 5 · Artifact Details</p><h2 className="font-display mt-3 text-3xl italic text-ink">Tell the artifact&apos;s story</h2><p className="mt-2 text-sm leading-relaxed text-stone">Add the public record, display image, provenance, license, and listing details that the curator will review.</p></div>
            <div className="mt-7 flex flex-col gap-6">
              <div>
                <label className="text-[10px] tracking-label uppercase text-stone">
                  Display Photo <span className="text-red-700">*</span>
                </label>
                <label className="mt-2.5 flex cursor-pointer items-center justify-between border border-line px-4 py-3 hover:border-stone">
                  <span className="truncate text-sm text-ink">
                    {photo?.name ?? "Choose a clear artifact photo"}
                  </span>
                  <span className="ms-4 text-[10px] tracking-label text-stone uppercase">Browse</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    required
                    className="hidden"
                    onChange={(event) => {
                      const selected = event.target.files?.[0] ?? null;
                      if (selected && selected.size > 10 * 1024 * 1024) {
                        museumToast.error("Photo rejected", "Display photos must be 10 MB or smaller.");
                        event.target.value = "";
                        setPhoto(null);
                        return;
                      }
                      setPhoto(selected);
                    }}
                  />
                </label>
                <p className="mt-1.5 text-xs text-stone">JPG, PNG, WebP, or AVIF · max 10 MB. This image appears on artifact cards and detail pages.</p>
              </div>
              <div>
                <label className="text-[10px] tracking-label uppercase text-stone">
                  Artifact Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cycladic Marble Figure"
                  className="mt-2.5 w-full border-b border-line bg-transparent pb-2.5 text-sm text-ink placeholder:text-stone-light focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-label uppercase text-stone">
                  Public Description <span className="text-red-700">*</span>
                </label>
                <textarea
                  required
                  minLength={40}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the artifact, its provenance, condition, and why it is significant (at least 40 characters)."
                  className="mt-2.5 min-h-28 w-full border border-line bg-transparent p-3 text-sm text-ink placeholder:text-stone-light focus:border-ink focus:outline-none"
                />
                <div className="mt-1 flex flex-col justify-between gap-1 text-xs sm:flex-row"><p className={description.length > 0 && description.trim().length < 40 ? "text-red-700" : "text-stone"}>Minimum 40 characters · maximum 2,000</p><p className={description.length >= 1900 ? "text-amber-800" : "text-stone"}>{description.length} / 2,000</p></div>
                <p className="mt-1 text-xs leading-relaxed text-stone">The 3D museum panel presents a concise five-line preview; the complete description remains available on the artifact page.</p>
              </div>
              <div>
                <label className="text-[10px] tracking-label uppercase text-stone">
                  Origin / Provenance
                </label>
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Greece, 2700 BCE"
                  className="mt-2.5 w-full border-b border-line bg-transparent pb-2.5 text-sm text-ink placeholder:text-stone-light focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-label uppercase text-stone">
                  Primary Material <span className="text-red-700">*</span>
                </label>
                <select value={materialChoice} onChange={(event) => { const value = event.target.value; setMaterialChoice(value); setMaterial(value === "other" ? "" : value); }} required className="mt-2.5 w-full border border-line bg-transparent px-3 py-3 text-sm text-ink focus:border-ink focus:outline-none">
                  <option value="" disabled>Select a primary material</option>
                  {materialOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  <option value="other">Other — specify material</option>
                </select>
                {materialChoice === "other" && <input value={material} onChange={(event) => setMaterial(event.target.value)} required autoFocus placeholder="Specify the primary material" className="mt-3 w-full border-b border-line bg-transparent pb-2.5 text-sm text-ink placeholder:text-stone-light focus:border-ink focus:outline-none" />}
                {category === "community-uploads" && <p className="mt-1.5 text-xs text-stone">Community artifacts span many traditions, so please identify the material used to make this object.</p>}
              </div>
            </div>

            <div className="mt-8 border-t border-line pt-7">
              <p className="text-[10px] tracking-label uppercase text-stone">Language</p>
              <p className="mt-2 text-xs leading-relaxed text-stone">Enter the artifact details in English. When a visitor views this artifact in another language, Gemini translates it on demand and the translation is saved for future visits.</p>
            </div>

            {type === "video-scan" && (
              <div className="mt-8 bg-cream-dark px-5 py-4 text-xs leading-relaxed text-charcoal/70">
                This artifact already has its own lighting from the video — no lighting preset is needed.
              </div>
            )}

            <p className="mt-8 text-[10px] tracking-label text-stone uppercase">
              Listing Price
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPriceMode("free")}
                  className={`border px-5 py-4 text-start ${
                  priceMode === "free"
                    ? "border-ink bg-cream-dark"
                    : "border-line hover:border-stone"
                }`}
              >
                <p className="text-sm text-ink">Free</p>
                <p className="mt-1 text-xs text-stone">
                  Available at no cost to buyers
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPriceMode("paid")}
                  className={`border px-5 py-4 text-start ${
                  priceMode === "paid"
                    ? "border-ink bg-cream-dark"
                    : "border-line hover:border-stone"
                }`}
              >
                <p className="text-sm text-ink">Paid Asset</p>
                <p className="mt-1 text-xs text-stone">
                  Set a price for buyers to purchase
                </p>
              </button>
            </div>
            {priceMode === "paid" && (
              <div className="mt-4 flex items-center border-b border-line pb-2.5">
                <span className="text-sm text-stone">$</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="decimal"
                  className="w-full bg-transparent px-2 text-sm text-ink focus:outline-none"
                />
                <span data-no-translate className="text-[10px] tracking-label text-stone-light uppercase">
                  USD
                </span>
              </div>
            )}

            <p className="mt-8 text-[10px] tracking-label text-stone uppercase">
              License Type
            </p>
            <div data-no-translate className="mt-3 divide-y divide-line border-t border-b border-line">
              {licenseOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLicense(opt.key)}
                  className="flex w-full items-center justify-between py-3.5 text-start"
                >
                  <span>
                    <span className="block text-sm text-ink">{opt.name}</span>
                    <span className="block text-xs text-stone">
                      {opt.desc}
                    </span>
                  </span>
                  <span
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                      license === opt.key ? "bg-ink" : "border border-line"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="border border-line px-6 py-3.5 text-[11px] tracking-label text-ink uppercase hover:bg-black/5"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canReview) {
                    museumToast.warning("Upload details are incomplete", "Add a name, description, artifact file, and display photo before review.");
                    return;
                  }
                  setStep(5);
                }}
                className={`flex-1 py-3.5 text-[11px] tracking-label uppercase transition-colors ${
                  canReview
                    ? "bg-ink text-cream hover:bg-charcoal"
                    : "cursor-not-allowed bg-cream-dark text-stone-light"
                }`}
              >
              Review
              </button>
            </div>
            </>}
          </motion.div>
        )}

        {/* Step 5 — Review */}
        {step === 5 && (
          <motion.div
            key="review"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 24 }}
            className="mt-8"
          >
            <p className="text-sm text-stone">
              Review your submission before it reaches a museum curator
            </p>

            {fileUrl && isModelType && modelFormat && lightTemperature && lightDirection && (
              <div className="mt-6 -mx-6 md:-mx-10">
                <ArtifactStageFullscreen immersiveDetails hideOverlayActions viewer={<LightingStudioViewer src={fileUrl} format={modelFormat} lightTemperature={lightTemperature} lightDirection={lightDirection} title={name || fileName || "Uploaded artifact"} museumLayout="details" focusArtifactWithExhibit plaqueOrigin={origin || "Origin pending"} displayStyle={getExhibitDisplayStyle(category, material)} panelDetails={{ uploadType: "Upload Review · Draft", title: name || fileName || "Uploaded artifact", uploader: "Museum Contributor", description, material: material || selectedCategory?.name || "Artifact", origin: origin || "Not specified", license: selectedLicense?.name ?? "Creator-specified", price: priceMode === "free" ? "Free" : `$${price}` }} />} overlay={<div><p className="text-[9px] tracking-label text-stone uppercase">Step 5 of 5 · Review</p><h2 className="font-display mt-3 text-2xl italic">{name}</h2><p className="mt-2 text-xs text-stone">{selectedCategory?.name} · {getLightTemperature(lightTemperature).name} · {getLightDirection(lightDirection).name}</p><p className="mt-4 text-sm leading-relaxed text-charcoal/80">{description}</p></div>} />
              </div>
            )}
            {fileUrl && type === "video-scan" && (
              <div className="mt-6 -mx-6 md:-mx-10"><ArtifactStageFullscreen splitDetails viewer={<video className="h-full w-full bg-black object-contain" controls src={fileUrl}>Your browser does not support video playback.</video>} overlay={<div><p className="text-[9px] tracking-label text-stone uppercase">Step 5 of 5 · Review</p><h2 className="font-display mt-3 text-2xl italic">{name}</h2><p className="mt-4 text-sm leading-relaxed text-charcoal/80">{description}</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setStep(4)} className="border border-line px-5 py-3 text-[10px] tracking-label uppercase">Back</button><button type="button" onClick={submitUpload} disabled={submitting} className="flex-1 bg-ink px-5 py-3 text-[10px] tracking-label text-cream uppercase">{submitting ? "Uploading…" : "Submit Artifact"}</button></div></div>} /></div>
            )}

            <div className="mt-6 divide-y divide-line border-t border-b border-line">
              <div className="flex items-center justify-between py-3.5">
                <span className="text-[10px] tracking-label text-stone uppercase">
                  Type
                </span>
                <span className="text-sm text-ink">
                  {selectedType?.name ?? "Not selected"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-[10px] tracking-label text-stone uppercase">
                  Category
                </span>
                <span className="text-sm text-ink">
                  {selectedCategory?.name ?? "Not selected"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-[10px] tracking-label text-stone uppercase">
                  File
                </span>
                <span className="text-sm text-ink">
                  {type === "image-to-3d" ? "Meshy-generated GLB" : fileName ?? "No file selected"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-[10px] tracking-label text-stone uppercase">
                  Display Photo
                </span>
                <span className="max-w-[65%] truncate text-sm text-ink">
                  {photo?.name ?? "No photo selected"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-[10px] tracking-label text-stone uppercase">
                  Lighting
                </span>
                <span className="text-sm text-ink">
                  {isModelType && lightTemperature && lightDirection ? `${getLightTemperature(lightTemperature).name} · ${getLightDirection(lightDirection).name}` : "Embedded in video"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-[10px] tracking-label text-stone uppercase">
                  Price
                </span>
                <span className="text-sm text-ink">
                  {priceMode === "free" ? "Free" : `$${price}`}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-[10px] tracking-label text-stone uppercase">
                  License
                </span>
                <span className="text-sm text-ink">
                  {selectedLicense?.name}
                </span>
              </div>
            </div>

            <div className="mt-5 border border-line bg-cream-dark px-5 py-4">
              <p className="text-xs leading-relaxed text-charcoal/70">
                Once submitted, a museum curator will review your artifact and place
                it in the virtual museum, coordinated with the matched
                lighting preset. Only staff accounts with the Curator role can
                approve or reject submissions. Expect placement within 3–5 working days.
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="border border-line px-6 py-3.5 text-[11px] tracking-label text-ink uppercase hover:bg-black/5"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={submitUpload}
                disabled={submitting}
                className="flex-1 bg-ink py-3.5 text-[11px] tracking-label text-cream uppercase hover:bg-charcoal"
              >
                {submitting ? "Uploading…" : "Submit Artifact"}
              </button>
            </div>
            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </section>
  );
}
