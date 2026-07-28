"use client";
import ErrorState from "@/components/ui/ErrorState";
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState {...props} title="The marketplace is unavailable" message="Listings could not be retrieved. Check your connection and try loading them again." />;
}
