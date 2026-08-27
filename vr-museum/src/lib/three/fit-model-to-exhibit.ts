import * as THREE from "three";

export type ExhibitFit = {
  centerX: number;
  centerZ: number;
  pedestalTopY: number;
  targetHeight: number;
  maxWidth: number;
  maxDepth: number;
  platformRotationY?: number;
};

const MIN_DIMENSION = 1e-6;

export function orientFlatModelForWall(object: THREE.Object3D) {
  object.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(object, true);
  if (bounds.isEmpty()) return "unchanged" as const;
  const size = bounds.getSize(new THREE.Vector3());
  const dimensions = [size.x, size.y, size.z];
  const smallest = Math.min(...dimensions);
  const largest = Math.max(...dimensions);
  if (!Number.isFinite(smallest) || smallest < MIN_DIMENSION || smallest / largest > 0.35) return "unchanged" as const;

  const thinAxis = dimensions.indexOf(smallest);
  if (thinAxis === 1) {
    object.rotation.x += Math.PI / 2;
    object.updateWorldMatrix(true, true);
    return "y-to-z" as const;
  }
  if (thinAxis === 0) {
    object.rotation.y -= Math.PI / 2;
    object.updateWorldMatrix(true, true);
    return "x-to-z" as const;
  }
  return "unchanged" as const;
}

export function straightenFlatModelOnWall(object: THREE.Object3D) {
  object.updateWorldMatrix(true, true);
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  const points: Array<[number, number]> = [];
  const point = new THREE.Vector3();

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const positions = child.geometry.getAttribute("position");
    if (!positions) return;
    const stride = Math.max(1, Math.ceil(positions.count / 8_000));
    for (let index = 0; index < positions.count; index += stride) {
      point.fromBufferAttribute(positions, index).applyMatrix4(child.matrixWorld);
      points.push([point.x, point.y]);
      sumX += point.x;
      sumY += point.y;
      count++;
    }
  });

  if (count < 3) return 0;
  const meanX = sumX / count;
  const meanY = sumY / count;
  let covarianceXX = 0;
  let covarianceXY = 0;
  let covarianceYY = 0;
  for (const [x, y] of points) {
    const dx = x - meanX;
    const dy = y - meanY;
    covarianceXX += dx * dx;
    covarianceXY += dx * dy;
    covarianceYY += dy * dy;
  }

  const principalAngle = 0.5 * Math.atan2(2 * covarianceXY, covarianceXX - covarianceYY);
  const targetAngle = covarianceYY >= covarianceXX ? Math.PI / 2 : 0;
  let correction = targetAngle - principalAngle;
  while (correction > Math.PI / 2) correction -= Math.PI;
  while (correction < -Math.PI / 2) correction += Math.PI;
  object.rotation.z += correction;
  object.updateWorldMatrix(true, true);
  return correction;
}

export function mountModelInFrontOfWall(object: THREE.Object3D, backZ = -0.32) {
  object.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(object, true);
  if (bounds.isEmpty()) return bounds;
  object.position.z += backZ - bounds.min.z;
  object.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(object, true);
}

/**
 * Uniformly fits authored model bounds inside an exhibit and grounds them on
 * the pedestal. Multiplying the existing scale preserves the file's authored
 * rotation and relative transforms.
 */
export function fitModelToExhibit(object: THREE.Object3D, fit: ExhibitFit) {
  if (fit.platformRotationY) object.rotation.y += fit.platformRotationY;
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
