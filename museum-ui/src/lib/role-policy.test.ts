import { describe, expect, it } from "vitest";

import { hasPermission } from "./role-policy";

describe("role policy", () => {
  it("keeps purchasing available to every completed canonical role", () => {
    for (const role of ["VISITOR", "RESEARCHER", "ARCHAEOLOGIST", "ARTIST", "CURATOR"] as const) {
      expect(hasPermission(role, "purchase")).toBe(true);
    }
  });

  it("limits contribution and moderation permissions", () => {
    expect(hasPermission("VISITOR", "upload")).toBe(false);
    expect(hasPermission("RESEARCHER", "sell")).toBe(false);
    expect(hasPermission("ARCHAEOLOGIST", "upload")).toBe(true);
    expect(hasPermission("ARTIST", "sell")).toBe(true);
    expect(hasPermission("ARTIST", "moderateUploads")).toBe(false);
    expect(hasPermission("CURATOR", "moderateUploads")).toBe(true);
    expect(hasPermission(null, "purchase")).toBe(false);
  });
});
