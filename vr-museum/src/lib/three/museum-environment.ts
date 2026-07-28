import * as THREE from "three";

function receiveShadows(mesh: THREE.Mesh) {
  mesh.receiveShadow = true;
  return mesh;
}

export function createMuseumEnvironment(): THREE.Group {
  const group = new THREE.Group();
  group.name = "museum-environment";

  const stone = new THREE.MeshStandardMaterial({ color: 0xd8d1c3, roughness: 0.88 });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x756d62, roughness: 0.78 });
  const brass = new THREE.MeshStandardMaterial({ color: 0x806b48, metalness: 0.55, roughness: 0.42 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xddeeff, transparent: true, opacity: 0.13, roughness: 0.08, transmission: 0.72, side: THREE.DoubleSide, depthWrite: false });

  const floor = receiveShadows(new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshStandardMaterial({ color: 0x292724, roughness: 0.94 })));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.55;
  floor.name = "floor";

  const platform = receiveShadows(new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.3, 0.22, 64), darkStone));
  platform.position.y = -1.43;
  platform.name = "platform";

  const pedestal = receiveShadows(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.05, 1.5), stone));
  pedestal.position.y = -0.8;
  pedestal.name = "pedestal";

  const caseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.45, 3.3, 2.45), glass);
  caseMesh.position.y = 0.55;
  caseMesh.name = "glass-case";

  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.32, 0.055), brass);
  plaque.position.set(0, -0.83, 0.785);
  plaque.rotation.x = -0.18;
  plaque.name = "plaque";

  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xd9c8a8, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
  const wallGlow = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), glowMaterial);
  wallGlow.position.set(0, 0.65, -3.6);
  wallGlow.name = "wall-glow";

  group.add(floor, platform, pedestal, caseMesh, plaque, wallGlow);
  return group;
}
