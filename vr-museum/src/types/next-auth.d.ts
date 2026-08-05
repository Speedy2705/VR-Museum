import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/validators/user";
import type { Locale } from "@/lib/i18n";

declare module "next-auth" {
  interface User {
    role?: UserRole | null;
    locale?: Locale;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole | null;
      locale: Locale;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole | null;
    locale?: Locale;
  }
}
