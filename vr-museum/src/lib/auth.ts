import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";
import { credentialsSchema, userRoleSchema } from "@/lib/validators/user";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { oauthProviders } from "@/lib/oauth-providers";
import { hasPermission, type Permission } from "@/lib/role-policy";

const isProduction = process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET
    ?? process.env.NEXTAUTH_SECRET
    ?? (isProduction ? undefined : "viswaroop-local-development-secret"),
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  providers: [
    ...oauthProviders,
    Credentials({
      credentials: {
        identifier: { label: "Email or mobile number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;
        const user = identifier.startsWith("+")
          ? await prisma.user.findUnique({ where: { phone: identifier } })
          : await prisma.user.findUnique({ where: { email: identifier } });

        if (
          !user?.passwordHash ||
          !(await compare(password, user.passwordHash))
        ) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          locale: isLocale(user.locale) ? user.locale : defaultLocale,
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
    newUser: "/complete-profile",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) token.sub = user.id;
      if (token.sub && (trigger === "update" || token.role === undefined)) {
        const profile = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, locale: true },
        });
        token.role = profile?.role ?? null;
        token.locale = isLocale(profile?.locale) ? profile.locale : defaultLocale;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        const role = userRoleSchema.safeParse(token.role);
        session.user.role = role.success ? role.data : null;
        session.user.locale = isLocale(token.locale) ? token.locale : defaultLocale;
      }
      return session;
    },
  },
});

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  const id = (session.user as typeof session.user & { id?: string }).id;
  if (!id) return null;
  return { ...session.user, id };
}

export async function requirePermission(request: Request, permission: Permission) {
  const user = await getCurrentUser();
  if (user && hasPermission(user.role, permission)) return user;

  const developmentUserId = request.headers.get("x-user-id");
  if (process.env.NODE_ENV !== "production" && developmentUserId) {
    const developmentUser = await prisma.user.findUnique({
      where: { id: developmentUserId },
      select: { id: true, name: true, email: true, image: true, role: true },
    });
    if (developmentUser && hasPermission(developmentUser.role, permission)) {
      return developmentUser;
    }
  }

  if (!user && !developmentUserId) {
    throw new ServiceError("Authentication is required", "UNAUTHORIZED", 401);
  }
  throw new ServiceError(
    "Your account role does not permit this action",
    "FORBIDDEN",
    403,
  );
}

export async function requireUserId(request: Request) {
  const user = await getCurrentUser();
  if (user) return user.id;

  const developmentUserId = request.headers.get("x-user-id");
  if (process.env.NODE_ENV !== "production" && developmentUserId) {
    const user = await prisma.user.findUnique({
      where: { id: developmentUserId },
      select: { id: true },
    });
    if (user) return user.id;
  }

  throw new ServiceError("Authentication is required", "UNAUTHORIZED", 401);
}
