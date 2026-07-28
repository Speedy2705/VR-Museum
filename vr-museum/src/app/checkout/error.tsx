"use client";
import ErrorState from "@/components/ui/ErrorState";
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState {...props} title="Checkout is temporarily unavailable" message="No payment was submitted. Please try opening checkout again." />;
}
