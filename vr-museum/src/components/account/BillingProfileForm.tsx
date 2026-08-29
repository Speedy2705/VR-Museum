"use client";

import { useState } from "react";
import { museumToast } from "@/lib/museum-toast";
import type { BillingProfile } from "@/types/billing";

const fields: Array<{
  key: keyof BillingProfile;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}> = [
  { key: "name", label: "Full name", required: true, autoComplete: "name" },
  { key: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
  { key: "phone", label: "Phone", type: "tel", required: true, autoComplete: "tel" },
  { key: "addressLine1", label: "Address line 1", required: true, autoComplete: "address-line1" },
  { key: "addressLine2", label: "Address line 2", autoComplete: "address-line2" },
  { key: "city", label: "City", required: true, autoComplete: "address-level2" },
  { key: "state", label: "State / Province", required: true, autoComplete: "address-level1" },
  { key: "postalCode", label: "Postal code", required: true, autoComplete: "postal-code" },
  { key: "country", label: "Country", required: true, autoComplete: "country-name" },
];

export default function BillingProfileForm({ initialProfile }: {
  initialProfile: BillingProfile;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="mt-6 grid gap-5 sm:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        setSaving(true);
        setError("");
        try {
          const response = await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profile),
          });
          const body = await response.json() as {
            success: boolean;
            data?: BillingProfile;
            error?: { message?: string };
          };
          if (!body.success || !body.data) {
            throw new Error(body.error?.message ?? "Profile could not be saved");
          }
          setProfile(body.data);
          museumToast.success("Checkout details saved", "These details will autofill at checkout.");
        } catch (saveError) {
          const message = saveError instanceof Error ? saveError.message : "Profile could not be saved";
          setError(message);
          museumToast.error("Could not save details", message);
        } finally {
          setSaving(false);
        }
      }}
    >
      {fields.map(({ key, label, type = "text", required, autoComplete }) => (
        <label key={key} className={key.startsWith("address") ? "sm:col-span-2" : ""}>
          <span className="text-xs tracking-label uppercase text-stone">
            {label}{required && <span className="ml-1 text-red-700">*</span>}
          </span>
          <input
            type={type}
            required={required}
            autoComplete={autoComplete}
            value={profile[key]}
            onChange={(event) => setProfile((current) => ({
              ...current,
              [key]: event.target.value,
            }))}
            className="mt-2 w-full border-b border-line bg-transparent pb-2 text-sm outline-none invalid:border-red-700 focus:border-ink"
          />
        </label>
      ))}
      {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
      <button
        disabled={saving}
        className="w-fit bg-ink px-6 py-3 text-xs tracking-label text-cream uppercase disabled:opacity-60 sm:col-span-2"
      >
        {saving ? "Saving…" : "Save checkout details"}
      </button>
    </form>
  );
}
