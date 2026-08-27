import { describe, expect, it } from "vitest";
import { getExhibitDisplayStyle } from "./artifact-categories";

describe("getExhibitDisplayStyle", () => {
  it.each([
    ["stories-in-color", "Artifact"],
    ["Stories in Colour", "Paint and pigment"],
    ["Community Uploads", "Textile"],
    ["Community Uploads", "Batik print"],
    ["Community Uploads", "Canvas painting"],
  ])("uses a framed wall for %s / %s", (category, material) => {
    expect(getExhibitDisplayStyle(category, material)).toBe("framed-art");
  });

  it.each([
    ["echoes-in-stone", "Stone"],
    ["earth-and-ember", "Terracotta"],
    ["forged-in-time", "Metal"],
  ])("uses a pedestal for %s / %s", (category, material) => {
    expect(getExhibitDisplayStyle(category, material)).toBe("sculpture");
  });

  it("does not classify a painted sculpture by material alone", () => {
    expect(getExhibitDisplayStyle("echoes-in-stone", "Paint and pigment")).toBe("sculpture");
  });
});
