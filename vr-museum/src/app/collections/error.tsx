"use client";
import ErrorState from "@/components/ui/ErrorState";
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState {...props} title="The collections are unavailable" message="We couldn’t retrieve the collection catalogue. Check your connection and try again." />;
}
