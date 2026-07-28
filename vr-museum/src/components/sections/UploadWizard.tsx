"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { notifyError } from "@/lib/client-error";
import { museumToast } from "@/lib/museum-toast";
import {
  ALLOWED_MODEL_EXTENSIONS,
  ALLOWED_VIDEO_EXTENSIONS,
  MAX_MODEL_FILE_SIZE_LABEL,
  MAX_VIDEO_FILE_SIZE_LABEL,
  MODEL_FILE_ACCEPT,
  VIDEO_FILE_ACCEPT,
  validateUploadFile,
} from "@/lib/upload-file-policy";

type ArtifactType = "3d-model" | "video-scan";
type PriceMode = "free" | "paid";

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
];

const lightingOptions = [
  {
    key: "warm-diffuse",
    name: "Warm Diffuse",
    desc: "Soft amber — ceramics, terracotta, bone",
  },
  {
    key: "directional-spot",
    name: "Directional Spot",
    desc: "Sharp key light — metal, bronze, gold",
  },
  {
    key: "cool-ambient",
    name: "Cool Ambient",
    desc: "Even blue-white — marble, pale stone",
  },
  {
    key: "backlit-halo",
    name: "Backlit Halo",
    desc: "Rim light — glass, crystal, resin",
  },
  {
    key: "raking-light",
    name: "Raking Light",
    desc: "Low single grazing — texture, incised marks",
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
  { key: 2, label: "File & Details" },
  { key: 3, label: "Review" },
];

export default function UploadWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const reduceMotion = useReducedMotion();

  const [type, setType] = useState<ArtifactType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [rejectedFile, setRejectedFile] = useState<{ name: string; reason: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState("");
  const [collection, setCollection] = useState("");
  const [material, setMaterial] = useState("");
  const [lighting, setLighting] = useState(lightingOptions[0].key);
  const [priceMode, setPriceMode] = useState<PriceMode>("free");
  const [price, setPrice] = useState("0.00");
  const [license, setLicense] = useState(licenseOptions[0].key);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedLighting = lightingOptions.find((l) => l.key === lighting);
  const selectedLicense = licenseOptions.find((l) => l.key === license);
  const selectedType = typeOptions.find((option) => option.key === type);
  const acceptedExtensions =
    type === "video-scan" ? ALLOWED_VIDEO_EXTENSIONS : ALLOWED_MODEL_EXTENSIONS;
  const acceptedFiles = type === "video-scan" ? VIDEO_FILE_ACCEPT : MODEL_FILE_ACCEPT;
  const maxFileSizeLabel =
    type === "video-scan" ? MAX_VIDEO_FILE_SIZE_LABEL : MAX_MODEL_FILE_SIZE_LABEL;

  const canReview = name.trim().length > 0 && description.trim().length >= 40 && file !== null && photo !== null;

  async function submitUpload() {
    if (!file || !photo || !type) {
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
    form.set("category", material || "Uncategorized");
    form.set("type", type);
    form.set("origin", origin);
    form.set("collection", collection);
    form.set("lighting", lighting);
    form.set("price", priceMode === "paid" ? price : "");
    form.set("license", license);

    try {
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
      <div className="mx-auto max-w-2xl">
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
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    if (type !== opt.key) {
                      setFile(null);
                      setFileName(null);
                      setRejectedFile(null);
                    }
                    setType(opt.key);
                  }}
                  className={`border px-5 py-5 text-left transition-colors ${
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
                  museumToast.warning("Choose an upload type", "Select a 3D model or video scan to continue.");
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

        {/* Step 2 — File & Details */}
        {step === 2 && (
          <motion.div
            key="details"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            className="mt-8"
          >
            <label className="block cursor-pointer border border-dashed border-line px-6 py-14 text-center hover:border-stone">
              <input
                type="file"
                accept={acceptedFiles}
                className="hidden"
                onChange={async (event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setRejectedFile(null);
                  if (!selected) {
                    setFile(null);
                    setFileName(null);
                    return;
                  }
                  const validation = await validateUploadFile(
                    selected,
                    type ?? "3d-model",
                  );
                  if (!validation.valid) {
                    setFile(null);
                    setFileName(null);
                    setRejectedFile({ name: selected.name, reason: validation.reason });
                    museumToast.error("File rejected", validation.reason);
                    event.target.value = "";
                    return;
                  }
                  setFile(selected);
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
            </label>
            {rejectedFile && (
              <div role="alert" className="mt-4 border border-red-900/25 bg-red-950/5 px-5 py-4">
                <p className="text-xs font-medium text-red-900">{rejectedFile.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-red-800">{rejectedFile.reason}</p>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-6">
              <div>
                <label className="text-[10px] tracking-label uppercase text-stone">
                  Display Photo <span className="text-red-700">*</span>
                </label>
                <label className="mt-2.5 flex cursor-pointer items-center justify-between border border-line px-4 py-3 hover:border-stone">
                  <span className="truncate text-sm text-ink">
                    {photo?.name ?? "Choose a clear artifact photo"}
                  </span>
                  <span className="ml-4 text-[10px] tracking-label text-stone uppercase">Browse</span>
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
                <p className={`mt-1 text-xs ${description.length > 0 && description.trim().length < 40 ? "text-red-700" : "text-stone"}`}>
                  {description.trim().length}/40 minimum characters
                </p>
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
                  Collection
                </label>
                <input
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  placeholder="e.g. Greco-Roman Antiquities"
                  className="mt-2.5 w-full border-b border-line bg-transparent pb-2.5 text-sm text-ink placeholder:text-stone-light focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-label uppercase text-stone">
                  Primary Material
                </label>
                <input
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. Marble"
                  className="mt-2.5 w-full border-b border-line bg-transparent pb-2.5 text-sm text-ink placeholder:text-stone-light focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            <p className="mt-8 text-[10px] tracking-label text-stone uppercase">
              Suggested Lighting
            </p>
            <div className="mt-3 divide-y divide-line border-t border-b border-line">
              {lightingOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLighting(opt.key)}
                  className="flex w-full items-center justify-between py-3.5 text-left"
                >
                  <span>
                    <span className="block text-sm text-ink">{opt.name}</span>
                    <span className="block text-xs text-stone">
                      {opt.desc}
                    </span>
                  </span>
                  <span
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                      lighting === opt.key ? "bg-ink" : "border border-line"
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className="mt-8 text-[10px] tracking-label text-stone uppercase">
              Listing Price
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPriceMode("free")}
                className={`border px-5 py-4 text-left ${
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
                className={`border px-5 py-4 text-left ${
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
                <span className="text-[10px] tracking-label text-stone-light uppercase">
                  USD
                </span>
              </div>
            )}

            <p className="mt-8 text-[10px] tracking-label text-stone uppercase">
              License Type
            </p>
            <div className="mt-3 divide-y divide-line border-t border-b border-line">
              {licenseOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLicense(opt.key)}
                  className="flex w-full items-center justify-between py-3.5 text-left"
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
                onClick={() => setStep(1)}
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
                  setStep(3);
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
          </motion.div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
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
                  File
                </span>
                <span className="text-sm text-ink">
                  {fileName ?? "No file selected"}
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
                  {selectedLighting?.name}
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
                onClick={() => setStep(2)}
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
