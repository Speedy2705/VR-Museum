import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/validators/user";

declare module "next-auth" {
  interface User {
    role?: UserRole | null;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole | null;
  }
}
