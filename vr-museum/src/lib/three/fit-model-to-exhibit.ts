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

function smallestEigenvector(covariance: number[][]) {
  const matrix = covariance.map((row) => [...row]);
  const vectors = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let iteration = 0; iteration < 24; iteration++) {
    let p = 0; let q = 1;
    for (const [row, column] of [[0, 1], [0, 2], [1, 2]] as const) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[p][q])) { p = row; q = column; }
    }
    if (Math.abs(matrix[p][q]) < 1e-10) break;
    const angle = 0.5 * Math.atan2(2 * matrix[p][q], matrix[q][q] - matrix[p][p]);
    const cosine = Math.cos(angle); const sine = Math.sin(angle);
    const app = matrix[p][p]; const aqq = matrix[q][q]; const apq = matrix[p][q];
    matrix[p][p] = cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
    matrix[q][q] = sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
    matrix[p][q] = matrix[q][p] = 0;
    for (let index = 0; index < 3; index++) {
      if (index === p || index === q) continue;
      const aip = matrix[index][p]; const aiq = matrix[index][q];
      matrix[index][p] = matrix[p][index] = cosine * aip - sine * aiq;
      matrix[index][q] = matrix[q][index] = sine * aip + cosine * aiq;
    }
    for (let row = 0; row < 3; row++) {
      const vip = vectors[row][p]; const viq = vectors[row][q];
      vectors[row][p] = cosine * vip - sine * viq;
      vectors[row][q] = sine * vip + cosine * viq;
    }
  }
  const index = [0, 1, 2].reduce((smallest, candidate) => matrix[candidate][candidate] < matrix[smallest][smallest] ? candidate : smallest, 0);
  return new THREE.Vector3(vectors[0][index], vectors[1][index], vectors[2][index]).normalize();
}

/** Aligns an irregular artifact's best-fit surface plane with the frame plane. */
export function alignModelPlaneToWall(object: THREE.Object3D) {
  object.updateWorldMatrix(true, true);
  const points: THREE.Vector3[] = [];
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const positions = child.geometry.getAttribute("position");
    if (!positions) return;
    const stride = Math.max(1, Math.ceil(positions.count / 8_000));
    for (let index = 0; index < positions.count; index += stride) {
      points.push(new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(child.matrixWorld));
    }
  });
  if (points.length < 3) return 0;

  const mean = points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / points.length);
  const covariance = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const point of points) {
    const x = point.x - mean.x; const y = point.y - mean.y; const z = point.z - mean.z;
    covariance[0][0] += x * x; covariance[0][1] += x * y; covariance[0][2] += x * z;
    covariance[1][0] += y * x; covariance[1][1] += y * y; covariance[1][2] += y * z;
    covariance[2][0] += z * x; covariance[2][1] += z * y; covariance[2][2] += z * z;
  }
  const normal = smallestEigenvector(covariance);
  if (normal.z < 0) normal.negate();
  const target = new THREE.Vector3(0, 0, 1);
  const correction = new THREE.Quaternion().setFromUnitVectors(normal, target);
  const angle = normal.angleTo(target);
  object.quaternion.premultiply(correction);
  object.updateWorldMatrix(true, true);
  return angle;
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
  const bounds = new THREE.Box3().setFromObject(object, true).getSize(new THREE.Vector3());
  const faceAspect = Math.min(bounds.x, bounds.y) / Math.max(bounds.x, bounds.y);
  // Square scans already inherit the source GLB axes after wall alignment.
  // Their uneven folds must not be mistaken for an in-plane rotation signal.
  if (faceAspect >= 0.9) return 0;
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

  // A square face has no stable principal X/Y direction. Folds and scan noise
  // can otherwise make PCA select a diagonal and rotate the artwork by ~45°.
  // Preserve the authored in-plane rotation when the two face axes are close.
  const spread = covarianceXX + covarianceYY;
  const anisotropy = spread > MIN_DIMENSION
    ? Math.hypot(covarianceXX - covarianceYY, 2 * covarianceXY) / spread
    : 0;
  if (anisotropy < 0.12) return 0;
  const principalAngle = 0.5 * Math.atan2(2 * covarianceXY, covarianceXX - covarianceYY);
  const targetAngle = covarianceYY >= covarianceXX ? Math.PI / 2 : 0;
  let correction = targetAngle - principalAngle;
  while (correction > Math.PI / 2) correction -= Math.PI;
  while (correction < -Math.PI / 2) correction += Math.PI;
  // Rotate around the frame's world-space normal. Updating Euler rotation.z
  // here would use the model's authored local axes and can tilt an already
  // aligned surface back out of the frame plane.
  object.quaternion.premultiply(
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), correction),
  );
  object.updateWorldMatrix(true, true);
  return correction;
}

/** Places oriented wall art in a mount whose axes exactly match the frame. */
export function createWallArtMount(object: THREE.Object3D) {
  const mount = new THREE.Group();
  mount.name = "wall-art-mount";
  mount.add(object);
  mount.updateWorldMatrix(true, true);
  return mount;
}

// The framed-art backing has its front face at z=-0.39. A one-centimetre
// clearance prevents z-fighting while keeping the artifact visually attached.
export function mountModelInFrontOfWall(object: THREE.Object3D, backZ = -0.38) {
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
