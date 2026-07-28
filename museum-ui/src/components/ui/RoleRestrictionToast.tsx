"use client";

import { useEffect } from "react";
import { museumToast } from "@/lib/museum-toast";

export default function RoleRestrictionToast() {
  useEffect(() => {
    museumToast.warning(
      "This action is role-restricted",
      "Your current museum role does not include this permission.",
    );
  }, []);
  return null;
}
