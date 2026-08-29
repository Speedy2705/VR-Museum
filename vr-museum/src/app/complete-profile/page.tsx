"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { userRoles } from "@/lib/validators/user";
import { museumToast } from "@/lib/museum-toast";
import { notifyError } from "@/lib/client-error";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/sign-in");
    if (session?.user.role) router.replace("/");
  }, [router, session?.user.role, status]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const body = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };
      if (!response.ok || !body.success) {
        const message = body.error?.message ?? "Unable to complete your profile";
        setError(message);
        museumToast.error("Profile could not be updated", message);
        setSubmitting(false);
        return;
      }
      await update();
      museumToast.success("Profile updated", "Your museum role has been saved.");
      const returnTo = new URLSearchParams(window.location.search).get("returnTo") ?? "/";
      router.replace(returnTo.startsWith("/") ? returnTo : "/");
      router.refresh();
    } catch (profileError) {
      setError(notifyError(profileError, "Unable to complete your profile. Please try again."));
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main className="min-h-[65vh] bg-cream px-6 py-20 text-ink">
        <div className="mx-auto max-w-lg">
          <p className="text-xs tracking-label uppercase text-stone">One last step</p>
          <h1 className="font-display mt-4 text-4xl italic">Complete your profile</h1>
          <p className="mt-4 text-sm leading-7 text-stone">
            Choose the role that best describes how you plan to use the museum.
          </p>
          <form onSubmit={submit} className="mt-10">
            <label htmlFor="profile-role" className="text-xs tracking-label uppercase text-stone">
              Role<span className="ms-1 text-red-700" aria-hidden="true">*</span>
            </label>
            <select
              id="profile-role"
              required
              value={role}
              onChange={(event) => setRole(event.target.value)}
              aria-describedby="profile-role-help"
              className="mt-3 w-full border-b border-line bg-transparent py-3 text-base focus:border-ink focus:outline-none"
            >
              <option value="" disabled>Select your role</option>
              {userRoles.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div id="profile-role-help" className="mt-5 space-y-2 rounded-sm bg-cream-dark p-4">
              {userRoles.map((option) => (
                <p key={option.value} className="text-sm leading-relaxed text-charcoal"><strong className="font-medium text-ink">{option.label}:</strong> {option.description}</p>
              ))}
            </div>
            {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={!role || submitting}
              className="mt-8 w-full bg-ink py-3.5 text-xs tracking-label uppercase text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Continue to the museum"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
