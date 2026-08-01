import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  registerUser: vi.fn(),
  completeUserProfile: vi.fn(),
  addCartItem: vi.fn(),
  getCart: vi.fn(),
  removeCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  createPendingOrder: vi.fn(),
  requireUserId: vi.fn(),
  requirePermission: vi.fn(),
  createUpload: vi.fn(),
  moderateUpload: vi.fn(),
  authPost: vi.fn(),
  authGet: vi.fn(),
  fileSave: vi.fn(),
}));

vi.mock("@/server/services/user.service", () => ({
  registerUser: mocks.registerUser,
  completeUserProfile: mocks.completeUserProfile,
}));
vi.mock("@/server/services/cart.service", () => ({
  addCartItem: mocks.addCartItem,
  getCart: mocks.getCart,
  removeCartItem: mocks.removeCartItem,
  updateCartItem: mocks.updateCartItem,
}));
vi.mock("@/server/services/checkout.service", () => ({
  createPendingOrder: mocks.createPendingOrder,
}));
vi.mock("@/lib/auth", () => ({
  requireUserId: mocks.requireUserId,
  requirePermission: mocks.requirePermission,
  handlers: { POST: mocks.authPost, GET: mocks.authGet },
}));
vi.mock("@/server/services/upload.service", () => ({
  createUpload: mocks.createUpload,
  moderateUpload: mocks.moderateUpload,
}));
vi.mock("@/server/storage", () => ({
  fileStorage: { save: mocks.fileSave },
}));

import { resetRateLimits } from "@/lib/rate-limit";
import { POST as register } from "./auth/register/route";
import { PATCH as completeProfile } from "./profile/route";
import { POST as login } from "./auth/[...nextauth]/route";
import { GET as getCart, POST as addToCart } from "./cart/route";
import { POST as checkout } from "./checkout/route";
import { POST as upload } from "./upload/route";
import { PATCH as moderateUpload } from "./moderation/uploads/[id]/route";
import { ServiceError } from "@/lib/service-error";

function jsonRequest(path: string, body: unknown, ip: string) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetRateLimits();
  mocks.requireUserId.mockResolvedValue("user-1");
  mocks.requirePermission.mockResolvedValue({ id: "user-1", role: "VISITOR" });
  mocks.fileSave.mockImplementation(async (file: File) => {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    return {
      url: `/uploads/${file.name}`,
      filename: file.name,
      extension,
      contentType: file.type,
      size: file.size,
    };
  });
});

describe("key API routes", () => {
  it("registers a validated, normalized user", async () => {
    mocks.registerUser.mockResolvedValue({
      id: "user-1",
      email: "curator@example.com",
      name: "Curator",
    });
    const response = await register(
      jsonRequest(
        "/api/auth/register",
        {
          email: "CURATOR@EXAMPLE.COM",
          name: " Curator ",
          password: "museum-pass",
          role: "CURATOR",
        },
        "10.0.0.1",
      ),
    );

    expect(response.status).toBe(201);
    expect(mocks.registerUser).toHaveBeenCalledWith({
      email: "curator@example.com",
      name: "Curator",
      password: "museum-pass",
      role: "CURATOR",
    });
    expect(await response.json()).toMatchObject({ success: true });
  });

  it("completes an OAuth profile with a canonical role", async () => {
    mocks.completeUserProfile.mockResolvedValue({
      id: "user-1",
      role: "RESEARCHER",
    });
    const response = await completeProfile(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "RESEARCHER" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.completeUserProfile).toHaveBeenCalledWith("user-1", "RESEARCHER");
  });

  it("delegates credentials login to Auth.js", async () => {
    mocks.authPost.mockResolvedValue(
      Response.json({ url: "http://localhost/marketplace" }),
    );
    const request = new Request(
      "http://localhost/api/auth/callback/credentials",
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.2" },
      },
    );
    const response = await login(request as never);

    expect(mocks.authPost).toHaveBeenCalledWith(request);
    expect(response.status).toBe(200);
  });

  it("adds a validated listing to the authenticated cart", async () => {
    mocks.addCartItem.mockResolvedValue({ id: "cart-1", quantity: 1 });
    const response = await addToCart(
      jsonRequest(
        "/api/cart",
        { listingId: "listing-1", quantity: 1 },
        "10.0.0.3",
      ),
    );

    expect(response.status).toBe(201);
    expect(mocks.addCartItem).toHaveBeenCalledWith("user-1", {
      listingId: "listing-1",
      quantity: 1,
    });
  });

  it("rejects an unauthenticated direct cart request with 401", async () => {
    mocks.requirePermission.mockRejectedValueOnce(
      new ServiceError("Authentication is required", "UNAUTHORIZED", 401),
    );

    const response = await getCart(new Request("http://localhost/api/cart"));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      success: false,
      error: { code: "UNAUTHORIZED" },
    });
    expect(mocks.getCart).not.toHaveBeenCalled();
  });

  it("rejects a direct upload API call when the role lacks permission", async () => {
    mocks.requirePermission.mockRejectedValueOnce(
      new ServiceError(
        "Your account role does not permit this action",
        "FORBIDDEN",
        403,
      ),
    );
    const response = await upload(
      jsonRequest(
        "/api/upload",
        {
          title: "Restricted upload",
          category: "Stone",
          fileUrl: "/uploads/restricted.glb",
          metadata: {},
        },
        "10.0.0.8",
      ),
    );

    expect(response.status).toBe(403);
    expect(mocks.createUpload).not.toHaveBeenCalled();
  });

  it("accepts a valid signed GLB upload", async () => {
    mocks.createUpload.mockResolvedValue({ id: "upload-1", status: "PENDING" });
    const form = new FormData();
    form.set("title", "Valid model");
    form.set("category", "forged-in-time");
    form.set("lighting", "directional-spot");
    form.set("lightTemperature", "cool-white");
    form.set("lightDirection", "spotlight");
    form.set("type", "3d-model");
    form.set("description", "A documented bronze artifact scan with sufficient provenance for public curator review.");
    form.set(
      "file",
      new File(
        [new Uint8Array([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0, 12, 0, 0, 0])],
        "model.glb",
        { type: "model/gltf-binary" },
      ),
    );
    form.set("photo", new File(["photo"], "artifact.jpg", { type: "image/jpeg" }));

    const response = await upload(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );

    expect(response.status).toBe(201);
    expect(mocks.fileSave).toHaveBeenCalledTimes(2);
    expect(mocks.createUpload).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        mediaType: "MODEL_3D",
        modelFormat: "glb",
      }),
    );
  });

  it("accepts a valid MP4 video scan upload", async () => {
    mocks.createUpload.mockResolvedValue({ id: "upload-video", status: "PENDING" });
    const form = new FormData();
    form.set("title", "Turntable video scan");
    form.set("category", "forged-in-time");
    form.set("type", "video-scan");
    form.set("description", "A complete turntable recording of the artifact for photogrammetry and curator review.");
    form.set(
      "file",
      new File(
        [new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])],
        "scan.mp4",
        { type: "video/mp4" },
      ),
    );
    form.set("photo", new File(["photo"], "artifact.jpg", { type: "image/jpeg" }));

    const response = await upload(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );

    expect(response.status).toBe(201);
    expect(mocks.fileSave).toHaveBeenCalledTimes(2);
    expect(mocks.createUpload).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        mediaType: "VIDEO",
        modelFormat: null,
        metadata: expect.objectContaining({ type: "video-scan" }),
      }),
    );
  });

  it("rejects an invalid upload before storage or database creation", async () => {
    const form = new FormData();
    form.set("title", "Executable");
    form.set("category", "Other");
    form.set("type", "3d-model");
    form.set(
      "file",
      new File(["not a model"], "malware.exe", {
        type: "application/x-msdownload",
      }),
    );

    const response = await upload(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: { code: "INVALID_UPLOAD_FILE" },
    });
    expect(mocks.fileSave).not.toHaveBeenCalled();
    expect(mocks.createUpload).not.toHaveBeenCalled();
  });

  it("rejects JSON upload attempts that bypass file validation", async () => {
    const response = await upload(
      jsonRequest(
        "/api/upload",
        {
          title: "Bypass attempt",
          category: "Other",
          fileUrl: "/uploads/unvalidated.exe",
          metadata: {},
        },
        "10.0.0.9",
      ),
    );

    expect(response.status).toBe(415);
    expect(mocks.fileSave).not.toHaveBeenCalled();
    expect(mocks.createUpload).not.toHaveBeenCalled();
  });

  it("rejects an oversized model before storage or database creation", async () => {
    const file = new File(
      [new Uint8Array([0x67, 0x6c, 0x54, 0x46])],
      "huge.glb",
      { type: "model/gltf-binary" },
    );
    Object.defineProperty(file, "size", { value: 150 * 1024 * 1024 + 1 });
    const form = new FormData();
    form.set("title", "Huge model");
    form.set("category", "Other");
    form.set("type", "3d-model");
    form.set("file", file);

    const response = await upload(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );

    expect(response.status).toBe(400);
    expect(mocks.fileSave).not.toHaveBeenCalled();
    expect(mocks.createUpload).not.toHaveBeenCalled();
  });

  it("rejects direct moderation by a non-curator", async () => {
    mocks.requirePermission.mockRejectedValueOnce(
      new ServiceError(
        "Your account role does not permit this action",
        "FORBIDDEN",
        403,
      ),
    );
    const response = await moderateUpload(
      new Request("http://localhost/api/moderation/uploads/upload-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      }),
      { params: Promise.resolve({ id: "upload-1" }) },
    );

    expect(response.status).toBe(403);
    expect(mocks.moderateUpload).not.toHaveBeenCalled();
  });

  it("checks out an authenticated user and rate-limits repeated attempts", async () => {
    mocks.createPendingOrder.mockResolvedValue({ id: "order-1", total: "10.50" });
    const first = await checkout(
      jsonRequest("/api/checkout", { paymentMethod: "card" }, "10.0.0.4"),
    );
    expect(first.status).toBe(201);
    expect(mocks.createPendingOrder).toHaveBeenCalledWith("user-1", "CARD");

    let response = first;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      response = await checkout(
        jsonRequest("/api/checkout", { paymentMethod: "card" }, "10.0.0.4"),
      );
    }
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({
      success: false,
      error: { code: "RATE_LIMITED" },
    });
  });
});
