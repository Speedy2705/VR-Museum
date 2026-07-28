import type { UserRole } from "@/lib/validators/user";

export type Permission =
  | "purchase"
  | "viewOrders"
  | "upload"
  | "sell"
  | "moderateUploads";

export const rolePermissions: Record<UserRole, readonly Permission[]> = {
  VISITOR: ["purchase", "viewOrders"],
  RESEARCHER: ["purchase", "viewOrders"],
  ARCHAEOLOGIST: ["purchase", "viewOrders", "upload", "sell"],
  ARTIST: ["purchase", "viewOrders", "upload", "sell"],
  CURATOR: ["purchase", "viewOrders", "upload", "sell", "moderateUploads"],
};

export function hasPermission(
  role: UserRole | null | undefined,
  permission: Permission,
) {
  return role ? rolePermissions[role].includes(permission) : false;
}

export const uploadRoles = ["ARTIST", "ARCHAEOLOGIST", "CURATOR"] as const;
export const moderationRoles = ["CURATOR"] as const;
