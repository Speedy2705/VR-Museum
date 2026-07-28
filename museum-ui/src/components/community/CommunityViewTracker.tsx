"use client";

import { useEffect, useRef } from "react";

export default function CommunityViewTracker({ uploadId }: { uploadId: string }) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    void fetch(`/api/uploads/${uploadId}/view`, {
      method: "POST",
      keepalive: true,
    });
  }, [uploadId]);

  return null;
}
