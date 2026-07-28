"use client";
import ErrorState from "@/components/ui/ErrorState";
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState {...props} title="Your cart couldn’t be opened" message="Your items are safe. Please try loading the cart again." />;
}
