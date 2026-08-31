import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { alignModelPlaneToWall, createWallArtMount, fitModelToExhibit, mountModelInFrontOfWall, orientFlatModelForWall, straightenFlatModelOnWall } from "./fit-model-to-exhibit";

const fit = {
  centerX: -2.35,
  centerZ: 0,
  pedestalTopY: -0.275,
  targetHeight: 2.475,
  maxWidth: 1.96,
  maxDepth: 1.96,
};

function model(width: number, height: number, depth: number) {
  const root = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth));
  mesh.position.set(4, 7, -3);
  root.add(mesh);
  return root;
}

describe("fitModelToExhibit", () => {
  it("centers and grounds a tall model at the target height", () => {
    const object = model(1, 4, 1);
    const result = fitModelToExhibit(object, fit);
    const size = result.bounds.getSize(new THREE.Vector3());
    const center = result.bounds.getCenter(new THREE.Vector3());

    expect(size.y).toBeCloseTo(fit.targetHeight);
    expect(result.bounds.min.y).toBeCloseTo(fit.pedestalTopY);
    expect(center.x).toBeCloseTo(fit.centerX);
    expect(center.z).toBeCloseTo(fit.centerZ);
  });

  it("constrains a wide model without overflowing the case", () => {
    const object = model(8, 2, 3);
    const result = fitModelToExhibit(object, fit);
    const size = result.bounds.getSize(new THREE.Vector3());

    expect(size.x).toBeCloseTo(fit.maxWidth);
    expect(size.y).toBeLessThanOrEqual(fit.targetHeight);
    expect(size.z).toBeLessThanOrEqual(fit.maxDepth);
    expect(result.bounds.min.y).toBeCloseTo(fit.pedestalTopY);
  });

  it("preserves the model's authored rotation", () => {
    const object = model(1, 2, 1);
    object.rotation.set(0.2, -0.7, 0.35);
    const rotation = { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z };

    fitModelToExhibit(object, fit);

    expect(object.rotation.x).toBeCloseTo(rotation.x);
    expect(object.rotation.y).toBeCloseTo(rotation.y);
    expect(object.rotation.z).toBeCloseTo(rotation.z);
  });

  it("aligns the model yaw with a rotated exhibit platform before fitting", () => {
    const object = model(1, 2, 1);
    object.rotation.y = -0.2;

    const result = fitModelToExhibit(object, { ...fit, platformRotationY: 0.35 });
    const center = result.bounds.getCenter(new THREE.Vector3());

    expect(object.rotation.y).toBeCloseTo(0.15);
    expect(result.bounds.min.y).toBeCloseTo(fit.pedestalTopY);
    expect(center.x).toBeCloseTo(fit.centerX);
    expect(center.z).toBeCloseTo(fit.centerZ);
  });
});

describe("orientFlatModelForWall", () => {
  it("stands up artwork authored flat on the X-Z plane", () => {
    const object = model(6, 0.1, 4);
    expect(orientFlatModelForWall(object)).toBe("y-to-z");
    const size = new THREE.Box3().setFromObject(object, true).getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(6);
    expect(size.y).toBeCloseTo(4);
    expect(size.z).toBeCloseTo(0.1);
  });

  it("turns artwork authored flat on the Y-Z plane toward the camera", () => {
    const object = model(0.1, 4, 6);
    expect(orientFlatModelForWall(object)).toBe("x-to-z");
    const size = new THREE.Box3().setFromObject(object, true).getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(6);
    expect(size.y).toBeCloseTo(4);
    expect(size.z).toBeCloseTo(0.1);
  });

  it("preserves artwork already authored on the X-Y wall plane", () => {
    const object = model(6, 4, 0.1);
    expect(orientFlatModelForWall(object)).toBe("unchanged");
  });
});

describe("straightenFlatModelOnWall", () => {
  it("removes an authored in-plane tilt while preserving geometry depth", () => {
    const object = model(3, 5, 0.2);
    object.rotation.z = THREE.MathUtils.degToRad(12);

    const correction = straightenFlatModelOnWall(object);
    const size = new THREE.Box3().setFromObject(object, true).getSize(new THREE.Vector3());

    expect(THREE.MathUtils.radToDeg(correction)).toBeCloseTo(-12, 0);
    expect(size.x).toBeCloseTo(3, 1);
    expect(size.y).toBeCloseTo(5, 1);
    expect(size.z).toBeCloseTo(0.2);
  });

  it("preserves the authored axes of square artwork", () => {
    const object = model(4, 4, 0.2);

    expect(straightenFlatModelOnWall(object)).toBe(0);
    const size = new THREE.Box3().setFromObject(object, true).getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(4, 1);
    expect(size.y).toBeCloseTo(4, 1);
  });
});

describe("alignModelPlaneToWall", () => {
  it("aligns an arbitrarily tilted artifact plane to the frame while preserving depth", () => {
    const object = model(3, 5, 0.2);
    object.rotation.set(0.62, -0.48, 0.17);
    const originalDepth = 0.2;

    expect(alignModelPlaneToWall(object)).toBeGreaterThan(0);
    const size = new THREE.Box3().setFromObject(object, true).getSize(new THREE.Vector3());

    expect(size.z).toBeCloseTo(originalDepth, 1);
    expect(size.x).toBeGreaterThan(2.9);
    expect(size.y).toBeGreaterThan(4.8);
  });

  it("remains parallel to the frame after its in-plane axes are straightened", () => {
    const object = model(3, 5, 0.2);
    object.rotation.set(0.7, -0.55, 0.42);

    alignModelPlaneToWall(object);
    straightenFlatModelOnWall(object);
    const size = new THREE.Box3().setFromObject(object, true).getSize(new THREE.Vector3());

    expect(size.z).toBeCloseTo(0.2, 1);
    expect(size.x * size.y).toBeGreaterThan(14.5);
  });
});

describe("mountModelInFrontOfWall", () => {
  it("places the deepest fold just in front of the wall without flattening it", () => {
    const object = model(3, 4, 1.25);
    const originalDepth = new THREE.Box3().setFromObject(object, true).getSize(new THREE.Vector3()).z;
    const bounds = mountModelInFrontOfWall(object);

    expect(bounds.min.z).toBeCloseTo(-0.38);
    expect(bounds.getSize(new THREE.Vector3()).z).toBeCloseTo(originalDepth);
  });
});

describe("createWallArtMount", () => {
  it("preserves every fitted dimension and exposes frame-aligned mount axes", () => {
    const object = model(3, 4, 1.25);
    object.rotation.x = Math.PI / 2;
    const sizeBefore = new THREE.Box3().setFromObject(object, true).getSize(new THREE.Vector3());
    const mount = createWallArtMount(object);
    const size = new THREE.Box3().setFromObject(mount, true).getSize(new THREE.Vector3());

    expect(size.x).toBeCloseTo(sizeBefore.x);
    expect(size.y).toBeCloseTo(sizeBefore.y);
    expect(size.z).toBeCloseTo(sizeBefore.z);
    expect(mount.rotation.x).toBe(0);
    expect(mount.rotation.y).toBe(0);
    expect(mount.rotation.z).toBe(0);
    expect(mount.scale.toArray()).toEqual([1, 1, 1]);
  });
});
