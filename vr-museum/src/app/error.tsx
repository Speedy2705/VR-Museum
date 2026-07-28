"use client";

import ErrorState from "@/components/ui/ErrorState";

export default function ErrorPage(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}
