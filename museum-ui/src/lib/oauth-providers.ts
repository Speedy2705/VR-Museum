import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";

// Both providers issue verified email claims. This opt-in lets Auth.js attach
// an OAuth account to an existing credentials user with the same email.
export const oauthProviders = [
  Google({ allowDangerousEmailAccountLinking: true }),
  Apple({ allowDangerousEmailAccountLinking: true }),
];
