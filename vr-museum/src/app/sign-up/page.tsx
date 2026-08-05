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
import { registerSchema, userRoles } from "@/lib/validators/user";
import { notifyError } from "@/lib/client-error";
import { museumToast } from "@/lib/museum-toast";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      password: String(data.get("password") ?? ""),
      role: String(data.get("role") ?? ""),
    });
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Check your details";
      setError(message);
      museumToast.warning("Check your account details", message);
      setSubmitting(false);
      return;
    }
    try {
      const credentials = parsed.data;
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const body = (await response.json()) as {
        success: boolean;
        error?: { message: string; code?: string };
      };
      if (!body.success) {
        const message =
          body.error?.code === "EMAIL_TAKEN"
            ? "An account with this email already exists"
            : body.error?.code === "PHONE_TAKEN"
              ? "An account with this mobile number already exists"
            : (body.error?.message ?? "Unable to create account");
        setError(message);
        museumToast.error("Account could not be created", message);
        setSubmitting(false);
        return;
      }
      const result = await signIn("credentials", {
        identifier: credentials.email || credentials.phone,
        password: credentials.password,
        redirect: false,
      });
      if (result?.error) {
        router.push("/sign-in");
        return;
      }
      museumToast.success("Welcome to the museum", "Your account has been created.");
      router.push("/");
      router.refresh();
    } catch (signUpError) {
      setError(notifyError(signUpError, "Account creation is unavailable. Please try again."));
      setSubmitting(false);
    }
  }
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main className="grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center bg-cream px-10 py-16 md:px-16 lg:px-20">
          <div className="mx-auto w-full max-w-sm">
            <Link
              href="/"
              className="text-[11px] tracking-label uppercase text-stone hover:text-ink"
            >
              ← Name
            </Link>

            <p className="mt-10 text-[10px] tracking-label uppercase text-stone">
              Join The Museum
            </p>
            <h1 className="font-display mt-3 text-4xl italic">
              Create account
            </h1>

            <form
              onSubmit={handleSubmit}
              className="mt-9 flex flex-col gap-6"
            >
              <FormField
                label="Full Name"
                name="name"
                placeholder="Jane Doe"
              />
              <FormField
                label="Email (optional)"
                type="email"
                name="email"
                placeholder="you@studio.com"
              />
              <FormField
                label="Mobile number (optional)"
                type="tel"
                name="phone"
                placeholder="+919876543210"
              />
              <p className="-mt-4 text-xs leading-relaxed text-stone">
                Enter at least one. Mobile numbers must include the international country code.
              </p>
              <PasswordField placeholder="••••••••" />

              <div>
                <label
                  htmlFor="role"
                  className="text-[10px] tracking-label uppercase text-stone"
                >
                  Role
                </label>
                <div className="relative mt-2.5 border-b border-line focus-within:border-ink">
                  <select
                    id="role"
                    name="role"
                    defaultValue=""
                    className="w-full appearance-none bg-transparent pb-2.5 text-sm text-ink focus:outline-none"
                  >
                    <option value="" disabled className="text-stone-light">
                      Select your role
                    </option>
                    {userRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-0 bottom-3 text-stone"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M5 8l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 bg-ink py-3.5 text-[11px] tracking-label uppercase text-white hover:bg-charcoal disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? "Creating Account…" : "Create Account"}
              </button>
            </form>

            <div className="mt-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[10px] tracking-label text-stone uppercase">
                Or
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <Suspense fallback={<div className="mt-7 h-10" />}>
              <SocialAuthButtons />
            </Suspense>

            <p className="mt-8 text-sm text-stone">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-ink underline underline-offset-4">
                Sign in
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
