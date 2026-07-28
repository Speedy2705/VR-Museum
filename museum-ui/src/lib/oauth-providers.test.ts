import { describe, expect, it } from "vitest";

import { oauthProviders } from "./oauth-providers";

describe("OAuth provider configuration", () => {
  it("enables verified-email linking for Google and Apple", () => {
    expect(oauthProviders.map((provider) => provider.id)).toEqual(["google", "apple"]);
    for (const provider of oauthProviders) {
      expect(provider.options?.allowDangerousEmailAccountLinking).toBe(true);
    }
  });
});
