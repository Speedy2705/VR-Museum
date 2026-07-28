"use client";

import { useSession } from "next-auth/react";

import { hasPermission, type Permission } from "@/lib/role-policy";

export function useRole() {
  const { data: session, status } = useSession();
  const role = session?.user.role ?? null;

  return {
    role,
    status,
    can: (permission: Permission) => hasPermission(role, permission),
    canPurchase: hasPermission(role, "purchase"),
    canUpload: hasPermission(role, "upload"),
    canSell: hasPermission(role, "sell"),
    canModerateUploads: hasPermission(role, "moderateUploads"),
  };
}
