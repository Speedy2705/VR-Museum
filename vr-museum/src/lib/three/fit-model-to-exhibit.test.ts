import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { fitModelToExhibit } from "./fit-model-to-exhibit";

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
});
