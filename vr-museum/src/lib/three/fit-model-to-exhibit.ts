import * as THREE from "three";

export type ExhibitFit = {
  centerX: number;
  centerZ: number;
  pedestalTopY: number;
  targetHeight: number;
  maxWidth: number;
  maxDepth: number;
};

const MIN_DIMENSION = 1e-6;

/**
 * Uniformly fits authored model bounds inside an exhibit and grounds them on
 * the pedestal. Multiplying the existing scale preserves the file's authored
 * rotation and relative transforms.
 */
export function fitModelToExhibit(object: THREE.Object3D, fit: ExhibitFit) {
  object.updateWorldMatrix(true, true);
  const initialBounds = new THREE.Box3().setFromObject(object, true);
  if (initialBounds.isEmpty()) throw new Error("The model has no visible geometry to fit.");

  const initialSize = initialBounds.getSize(new THREE.Vector3());
  const dimensions = [initialSize.x, initialSize.y, initialSize.z];
  if (dimensions.some((value) => !Number.isFinite(value) || value < MIN_DIMENSION)) {
    throw new Error("The model geometry has invalid bounds.");
  }

  const scaleFactor = Math.min(
    fit.targetHeight / initialSize.y,
    fit.maxWidth / initialSize.x,
    fit.maxDepth / initialSize.z,
  );
  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
    throw new Error("The model could not be scaled to the exhibit.");
  }

  object.scale.multiplyScalar(scaleFactor);
  object.updateWorldMatrix(true, true);

  const fittedBounds = new THREE.Box3().setFromObject(object, true);
  const fittedCenter = fittedBounds.getCenter(new THREE.Vector3());
  object.position.add(new THREE.Vector3(
    fit.centerX - fittedCenter.x,
    fit.pedestalTopY - fittedBounds.min.y,
    fit.centerZ - fittedCenter.z,
  ));
  object.updateWorldMatrix(true, true);

  return {
    scaleFactor,
    bounds: new THREE.Box3().setFromObject(object, true),
  };
}
