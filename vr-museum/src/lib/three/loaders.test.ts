import { describe, expect, it } from "vitest";
import { modelResourceBaseUrl } from "./loaders";

describe("modelResourceBaseUrl", () => {
  it("uses the current site as the resource base for temporary blob previews", () => {
    expect(modelResourceBaseUrl(
      new URL("blob:https://viswaroop.iiitdmj.ac.in/8434b870-cd64-429e-94cc-cbc05ee39a04"),
      "https://viswaroop.iiitdmj.ac.in/en/upload",
    )).toBe("https://viswaroop.iiitdmj.ac.in/en/");
  });

  it("uses the model directory for stored model URLs", () => {
    expect(modelResourceBaseUrl(
      new URL("https://cdn.example.com/uploads/artifact/model.glb"),
      "https://viswaroop.iiitdmj.ac.in/en/upload",
    )).toBe("https://cdn.example.com/uploads/artifact/");
  });
});
