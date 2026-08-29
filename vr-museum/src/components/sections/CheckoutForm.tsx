"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { useCart } from "@/context/CartContext";
import { notifyError } from "@/lib/client-error";
import { museumToast } from "@/lib/museum-toast";
import type { BillingProfile } from "@/types/billing";
import LogoLoader from "@/components/ui/LogoLoader";

const SERVICE_FEE_RATE = 0.05;
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type RazorpayConstructor = new (options: {
  key: string;
  amount: number | string;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  method: { upi: boolean };
  prefill: { name: string; email: string; contact: string };
  handler: () => void;
  modal: { ondismiss: () => void };
}) => { open(): void };

const requiredFields: Array<keyof BillingProfile> = [
  "name", "email", "phone", "addressLine1", "city", "state", "postalCode", "country",
];

function validateValue(field: keyof BillingProfile, value: string) {
  if (requiredFields.includes(field) && !value.trim()) return "This field is required.";
  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
  if (field === "phone" && !/^[+()\d\s.-]{7,30}$/.test(value)) return "Enter a valid phone number.";
  return "";
}

function CheckoutField({ field, label, profile, setValue, error, onBlur, type = "text", placeholder, required = true, autoComplete, inputMode }: {
  field: keyof BillingProfile;
  label: string;
  profile: BillingProfile;
  setValue: (value: string) => void;
  error?: string;
  onBlur: () => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <label htmlFor={`checkout-${field}`} className="text-xs tracking-label uppercase text-stone">
        {label}{required && <span className="ms-1 text-red-700">*</span>}
      </label>
      <input
        id={`checkout-${field}`}
        name={field}
        required={required}
        type={type}
        value={profile[field]}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => setValue(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `checkout-${field}-error` : undefined}
        className={`mt-2.5 w-full border-b bg-transparent pb-2.5 text-sm text-ink placeholder:text-stone-light focus:outline-none ${
          error ? "border-red-700" : "border-line focus:border-ink"
        }`}
      />
      {error && <p id={`checkout-${field}-error`} className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}

function Spinner() {
  return <LogoLoader label="Working" size="sm" tone="light" showLabel={false} className="me-2 align-middle" />;
}

function CardPayment({ orderId, onError, onSuccess }: {
  orderId: string;
  onError: (message: string) => void;
  onSuccess: (orderId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [complete, setComplete] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [elementError, setElementError] = useState("");

  return (
    <div className="space-y-5">
      <PaymentElement onChange={(event) => {
        setComplete(event.complete);
        if (event.complete) setElementError("");
      }} />
      {elementError && (
        <p role="alert" className="border-s-2 border-red-700 ps-3 text-sm text-red-700">
          {elementError}
        </p>
      )}
      <button
        type="button"
        disabled={!stripe || !elements || !complete || confirming}
        onClick={async () => {
          if (!stripe || !elements) return;
          setConfirming(true);
          setElementError("");
          const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/checkout/success?orderId=${encodeURIComponent(orderId)}`,
            },
            redirect: "if_required",
          });
          if (result.error) {
            const message = result.error.message ?? "The card was declined or invalid.";
            setElementError(message);
            onError(message);
            setConfirming(false);
          } else {
            onSuccess(orderId);
          }
        }}
        className="w-full bg-ink py-3.5 text-xs tracking-label text-cream uppercase disabled:cursor-not-allowed disabled:opacity-50"
      >
        {confirming ? <><Spinner />Processing payment…</> : "Pay securely by card"}
      </button>
    </div>
  );
}

async function loadRazorpay() {
  const target = window as typeof window & { Razorpay?: RazorpayConstructor };
  if (target.Razorpay) return target.Razorpay;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay Checkout could not be loaded"));
    document.head.appendChild(script);
  });
  if (!target.Razorpay) throw new Error("Razorpay Checkout is unavailable");
  return target.Razorpay;
}

export default function CheckoutForm({ initialProfile }: { initialProfile: BillingProfile }) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [profile, setProfile] = useState(initialProfile);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BillingProfile, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");
  const [cardIntent, setCardIntent] = useState<{ clientSecret: string; orderId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  const total = subtotal + serviceFee;

  const setValue = (field: keyof BillingProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: validateValue(field, value) }));
    }
  };
  const validateField = (field: keyof BillingProfile) => {
    setFieldErrors((current) => ({ ...current, [field]: validateValue(field, profile[field]) }));
  };
  const validateAll = () => {
    const next = Object.fromEntries(
      requiredFields.map((field) => [field, validateValue(field, profile[field])]),
    ) as Partial<Record<keyof BillingProfile, string>>;
    setFieldErrors(next);
    return !Object.values(next).some(Boolean);
  };
  const paymentSucceeded = (orderId: string) => {
    clear();
    museumToast.success("Payment submitted", "Your signed provider confirmation is being finalized.");
    router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
  };

  if (!items.length) {
    return (
      <section className="flex min-h-[420px] flex-col items-center justify-center bg-cream px-6 text-center">
        <h1 className="font-display text-3xl italic">Your cart is empty</h1>
        <p className="mt-3 text-sm text-stone">Add something from the marketplace before checking out.</p>
        <Link href="/marketplace" className="mt-8 bg-ink px-7 py-3.5 text-xs tracking-label text-cream uppercase">
          Go to Marketplace
        </Link>
      </section>
    );
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateAll() || !event.currentTarget.checkValidity()) {
      setError("Complete the highlighted fields before continuing.");
      museumToast.warning("Checkout details are incomplete", "Review every highlighted required field.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (paymentMethod === "card" && !stripePromise) throw new Error("Stripe publishable key is not configured.");
      const response = await fetch(
        paymentMethod === "card" ? "/api/payments/card/intent" : "/api/payments/upi/order",
        { method: "POST" },
      );
      const body = await response.json() as {
        success: boolean;
        data?: {
          orderId: string;
          clientSecret?: string | null;
          keyId?: string;
          providerOrderId?: string;
          amount?: number | string;
          currency?: string;
        };
        error?: { message: string };
      };
      if (!body.success || !body.data) throw new Error(body.error?.message ?? "Payment setup failed");

      if (paymentMethod === "card") {
        if (!body.data.clientSecret) throw new Error("Stripe did not return a client secret");
        setCardIntent({ clientSecret: body.data.clientSecret, orderId: body.data.orderId });
        setSubmitting(false);
        return;
      }

      const Razorpay = await loadRazorpay();
      if (!body.data.keyId || !body.data.providerOrderId) throw new Error("Invalid Razorpay order");
      new Razorpay({
        key: body.data.keyId,
        amount: body.data.amount ?? 0,
        currency: body.data.currency ?? "INR",
        order_id: body.data.providerOrderId,
        name: "ViswaRoop",
        description: "Digital artifact license",
        method: { upi: true },
        prefill: { name: profile.name, email: profile.email, contact: profile.phone },
        handler: () => paymentSucceeded(body.data!.orderId),
        modal: { ondismiss: () => setSubmitting(false) },
      }).open();
    } catch (paymentError) {
      setError(notifyError(paymentError, "Payment could not be started."));
      setSubmitting(false);
    }
  };

  const field = (key: keyof BillingProfile, label: string, options: {
    type?: string; placeholder?: string; required?: boolean; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  } = {}) => (
    <CheckoutField
      field={key}
      label={label}
      profile={profile}
      setValue={(value) => setValue(key, value)}
      error={fieldErrors[key]}
      onBlur={() => validateField(key)}
      {...options}
    />
  );

  return (
    <section className="bg-cream px-6 py-14 md:px-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl italic">Secure Checkout</h1>
        <p className="mt-2 text-sm text-stone">Required fields are marked with an asterisk.</p>
        <form onSubmit={submit} noValidate className="mt-10 grid grid-cols-1 gap-14 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-9">
            <section>
              <p className="text-xs tracking-label text-stone uppercase">Contact</p>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {field("name", "Full name", { placeholder: "Jane Doe", autoComplete: "name" })}
                {field("phone", "Phone number", { type: "tel", placeholder: "+91 98765 43210", autoComplete: "tel", inputMode: "tel" })}
              </div>
              <div className="mt-6">{field("email", "Email address", { type: "email", placeholder: "you@studio.com", autoComplete: "email" })}</div>
            </section>

            <section>
              <p className="text-xs tracking-label text-stone uppercase">Payment method</p>
              <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
                {(["card", "upi"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === method}
                    disabled={Boolean(cardIntent)}
                    onClick={() => setPaymentMethod(method)}
                    className={`border px-4 py-3 text-xs uppercase ${
                      paymentMethod === method ? "border-ink bg-ink text-cream" : "border-line hover:border-stone"
                    }`}
                  >
                    {method === "card" ? "Card" : "UPI"}
                  </button>
                ))}
              </div>
              {cardIntent && stripePromise ? (
                <div className="mt-6 rounded-sm border border-line bg-white p-5">
                  <Elements stripe={stripePromise} options={{ clientSecret: cardIntent.clientSecret }}>
                    <CardPayment
                      orderId={cardIntent.orderId}
                      onError={(message) => {
                        setError(message);
                        museumToast.error("Card payment failed", message);
                      }}
                      onSuccess={paymentSucceeded}
                    />
                  </Elements>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-stone">
                  {paymentMethod === "card"
                    ? "Stripe securely collects and validates the required card number, expiry, and CVC after you continue."
                    : "Razorpay securely collects and validates the required UPI VPA in its checkout window."}
                </p>
              )}
            </section>

            <section>
              <p className="text-xs tracking-label text-stone uppercase">Billing address</p>
              <div className="mt-4 flex flex-col gap-6">
                <p className="text-sm leading-relaxed text-stone">Your billing address is used for payment verification and purchase records; no physical item will be shipped.</p>
                {field("addressLine1", "Address line 1", { placeholder: "123 Museum Street", autoComplete: "address-line1" })}
                {field("addressLine2", "Address line 2", { placeholder: "Apartment, suite, etc.", required: false, autoComplete: "address-line2" })}
                <div className="grid gap-6 sm:grid-cols-2">
                  {field("city", "City", { placeholder: "Mumbai", autoComplete: "address-level2" })}
                  {field("state", "State / Province", { placeholder: "Maharashtra", autoComplete: "address-level1" })}
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {field("postalCode", "Postal code", { placeholder: "400001", autoComplete: "postal-code" })}
                  {field("country", "Country", { placeholder: "India", autoComplete: "country-name" })}
                </div>
              </div>
            </section>

            {error && <p role="alert" className="border-s-2 border-red-700 ps-3 text-sm text-red-700">{error}</p>}
            {!cardIntent && (
              <button
                type="submit"
                disabled={submitting}
                className="bg-ink py-3.5 text-xs tracking-label text-cream uppercase disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? <><Spinner />Preparing secure payment…</> : paymentMethod === "card"
                  ? `Continue to Card Payment — $${total.toFixed(2)}`
                  : `Pay with UPI — $${total.toFixed(2)} (converted to INR)`}
              </button>
            )}
            <p data-no-translate className="text-center text-xs text-stone">
              🔒 Payment details are handled by Stripe or Razorpay and never stored here.
            </p>
            <p className="text-center text-xs leading-relaxed text-stone">By continuing, you agree to the <Link href="/terms" className="underline underline-offset-2">purchase and license terms</Link> and acknowledge the <Link href="/privacy" className="underline underline-offset-2">privacy policy</Link>.</p>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs tracking-label text-stone uppercase">Order summary</p>
            <div className="mt-4 divide-y divide-line border-t border-line">
              {items.map((item) => (
                <div key={item.slug} className="flex items-center gap-3 py-4">
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden">
                    <PlaceholderImage src={item.image} alt={item.title} label={item.title} sizes="2.75rem" fit="contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{item.title}</p>
                    <p className="text-xs text-stone">{item.license} × {item.quantity}</p>
                  </div>
                  <span className="text-sm text-ink">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><span className="text-stone">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-stone">Taxes included</span><span>$0.00</span></div>
              <div className="flex justify-between"><span className="text-stone">Museum service fee (5%)</span><span>${serviceFee.toFixed(2)}</span></div>
            </div>
            <div className="mt-4 flex justify-between border-t border-line pt-4">
              <span>Total</span><span className="font-display text-2xl italic">${total.toFixed(2)}</span>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}
