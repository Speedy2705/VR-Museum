"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { museumToast } from "@/lib/museum-toast";
import LogoLoader from "@/components/ui/LogoLoader";

const oauthErrorMessage =
  "Social sign-in could not be completed. Please try again or use email and password.";

export default function SocialAuthButtons() {
  const [pending, setPending] = useState<"google" | "apple" | null>(null);
  const [localError, setLocalError] = useState("");
  const searchParams = useSearchParams();
  const error = localError || (searchParams.has("error") ? oauthErrorMessage : "");

  useEffect(() => {
    if (searchParams.has("error")) {
      museumToast.error("Social sign-in failed", oauthErrorMessage);
    }
  }, [searchParams]);

  async function start(provider: "google" | "apple") {
    setPending(provider);
    setLocalError("");
    try {
      await signIn(provider, { redirectTo: "/" });
    } catch {
      setLocalError(oauthErrorMessage);
      museumToast.error("Social sign-in failed", oauthErrorMessage);
      setPending(null);
    }
  }

  return (
    <>
      <div className="mt-7 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => start("google")}
          className="border border-line py-3 text-xs text-charcoal hover:border-ink disabled:cursor-wait disabled:opacity-60"
        >
          {pending === "google" ? <><LogoLoader label="Connecting to Google" size="sm" showLabel={false} className="me-2 align-middle" />Connecting…</> : "Continue with Google"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => start("apple")}
          className="border border-line py-3 text-xs text-charcoal hover:border-ink disabled:cursor-wait disabled:opacity-60"
        >
          {pending === "apple" ? <><LogoLoader label="Connecting to Apple" size="sm" showLabel={false} className="me-2 align-middle" />Connecting…</> : "Continue with Apple"}
        </button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    </>
  );
}
