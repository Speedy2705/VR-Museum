"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FormField from "@/components/ui/FormField";
import PasswordField from "@/components/ui/PasswordField";
import AuthVisualPanel from "@/components/auth/AuthVisualPanel";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { credentialsSchema } from "@/lib/validators/user";
import { notifyError } from "@/lib/client-error";
import { museumToast } from "@/lib/museum-toast";
import LogoLoader from "@/components/ui/LogoLoader";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"identifier" | "password", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setFieldErrors({});
    const data = new FormData(event.currentTarget);
    const credentials = credentialsSchema.safeParse({
      identifier: data.get("identifier"),
      password: data.get("password"),
    });
    if (!credentials.success) {
      const nextErrors: Partial<Record<"identifier" | "password", string>> = {};
      for (const issue of credentials.error.issues) {
        const field = issue.path[0];
        if ((field === "identifier" || field === "password") && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setFieldErrors(nextErrors);
      const message = credentials.error.issues[0]?.message ?? "Check your details";
      setError(message);
      museumToast.warning("Check your sign-in details", message);
      setSubmitting(false);
      return;
    }
    try {
      const result = await signIn("credentials", {
        ...credentials.data,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email/mobile number or password");
        museumToast.error("Sign-in failed", "Invalid email/mobile number or password.");
        setSubmitting(false);
        return;
      }
      const returnTo =
        new URLSearchParams(window.location.search).get("returnTo") ?? "/";
      router.push(returnTo.startsWith("/") ? returnTo : "/");
      router.refresh();
    } catch (signInError) {
      setError(notifyError(signInError, "Sign in is unavailable. Please try again."));
      setSubmitting(false);
    }
  }
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main className="grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center bg-cream px-10 py-16 md:px-16 lg:px-20">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-xs tracking-label uppercase text-stone">
              Welcome Back
            </p>
            <h1 className="font-display mt-3 text-4xl italic">Sign in</h1>

            <form
              onSubmit={handleSubmit}
              className="mt-9 flex flex-col gap-6"
            >
              <FormField
                label="Email or mobile number"
                type="text"
                name="identifier"
                placeholder="you@studio.com or +919876543210"
                required
                autoComplete="username"
                error={fieldErrors.identifier}
              />
              <div>
                <PasswordField placeholder="••••••••" required error={fieldErrors.password} />
                <div className="mt-2.5 flex justify-end">
                  <Link
                    href="#"
                    className="text-xs text-stone hover:text-ink"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 bg-ink py-3.5 text-xs tracking-label uppercase text-white hover:bg-charcoal disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? <><LogoLoader label="Signing in" size="sm" tone="light" showLabel={false} className="me-2 align-middle" />Signing In…</> : "Sign In"}
              </button>
            </form>

            <div className="mt-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-line" />
              <span className="text-xs tracking-label text-stone uppercase">
                Or
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <Suspense fallback={<div className="mt-7 flex h-10 items-center justify-center"><LogoLoader label="Loading sign-in options" size="sm" showLabel={false} /></div>}>
              <SocialAuthButtons />
            </Suspense>

            <p className="mt-8 text-sm text-stone">
              No account?{" "}
              <Link href="/sign-up" className="text-ink underline underline-offset-4">
                Create one
              </Link>
            </p>
          </div>
        </div>

        <AuthVisualPanel />
      </main>
      <Footer />
    </>
  );
}
