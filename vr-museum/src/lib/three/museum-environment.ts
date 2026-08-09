import * as THREE from "three";

function receiveShadows(mesh: THREE.Mesh) {
  mesh.receiveShadow = true;
  return mesh;
}

export type MuseumPanelDetails = { uploadType: string; title: string; uploader: string; description: string; material: string; origin: string; license: string; price: string };
type MuseumEnvironmentOptions = { exhibitOffsetX?: number; plaqueTitle?: string; plaqueOrigin?: string; showInfoDisplay?: boolean; panelDetails?: MuseumPanelDetails };

export const MUSEUM_EXHIBIT_FIT = {
  pedestalTopY: -0.275,
  targetHeight: 2.475,
  maxWidth: 1.96,
  maxDepth: 1.96,
} as const;

function createPlaqueTexture(title: string, origin: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 420;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#cfc5b4"; context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(67,54,38,.55)"; context.lineWidth = 9; context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
  context.textAlign = "center"; context.textBaseline = "middle";
  context.shadowColor = "rgba(255,255,255,.48)"; context.shadowOffsetX = 3; context.shadowOffsetY = 3;
  context.fillStyle = "#3f3426"; context.font = "italic 700 138px Georgia, serif"; context.fillText(title, 512, 145, 940);
  context.shadowColor = "rgba(255,255,255,.4)"; context.font = "600 72px Arial, sans-serif"; context.fillText(origin.toUpperCase(), 512, 300, 940);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}

function createBrandTexture() {
  const texture = new THREE.TextureLoader().load("/brand/viswaroop-logo-light.svg");
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createInfoTexture(details: MuseumPanelDetails) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200; canvas.height = 1500;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#eeeae2"; context.fillRect(0, 0, canvas.width, canvas.height);
  context.textBaseline = "top";
  const gold = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gold.addColorStop(0, "#6f4c18"); gold.addColorStop(0.45, "#b1843d"); gold.addColorStop(0.7, "#80591f"); gold.addColorStop(1, "#c09954");
  const mutedGold = context.createLinearGradient(0, 0, canvas.width, 0);
  mutedGold.addColorStop(0, "#74562b"); mutedGold.addColorStop(0.5, "#9b7842"); mutedGold.addColorStop(1, "#684b22");
  const engravedText = (text: string, x: number, y: number, font: string, color: string | CanvasGradient = gold, maxWidth?: number) => {
    context.font = font; context.fillStyle = color;
    context.shadowColor = "rgba(0,0,0,.38)"; context.shadowOffsetX = 2; context.shadowOffsetY = 3; context.shadowBlur = 1;
    context.fillText(text, x, y, maxWidth);
    context.shadowColor = "#ffffff"; context.shadowOffsetX = -2; context.shadowOffsetY = -2;
    context.fillText(text, x, y, maxWidth);
    context.shadowColor = "transparent";
  };
  const wrap = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) => {
    const words = text.split(/\s+/); let line = ""; let row = 0;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (context.measureText(test).width > maxWidth && line) {
        engravedText(line, x, y + row * lineHeight, context.font, mutedGold, maxWidth); line = word; row++;
        if (row >= maxLines) return y + row * lineHeight;
      } else line = test;
    }
    if (line && row < maxLines) { engravedText(line, x, y + row * lineHeight, context.font, mutedGold, maxWidth); row++; }
    return y + row * lineHeight;
  };
  engravedText(details.uploadType.toUpperCase(), 78, 62, "700 41px Arial, sans-serif", mutedGold, 1044);
  engravedText(details.title, 78, 142, "italic 700 134px Georgia, serif", gold, 1044);
  engravedText(`Uploaded by ${details.uploader}`, 78, 302, "600 52px Arial, sans-serif", mutedGold, 1044);
  context.font = "600 54px Arial, sans-serif";
  const descriptionBottom = wrap(details.description, 78, 420, 1044, 72, 5);
  let rowY = Math.max(descriptionBottom + 55, 710);
  const rows: Array<[string, string]> = [["Material", details.material], ["Origin", details.origin], ["License", details.license], ["Price", details.price]];
  for (const [label, value] of rows) {
    context.strokeStyle = "rgba(55,51,46,.25)"; context.lineWidth = 2; context.beginPath(); context.moveTo(78, rowY); context.lineTo(1122, rowY); context.stroke();
    engravedText(label, 78, rowY + 22, "600 49px Arial, sans-serif", mutedGold, 400);
    context.textAlign = "right"; engravedText(value, 1122, rowY + 22, "700 53px Arial, sans-serif", gold, 620); context.textAlign = "left";
    rowY += 130;
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  return texture;
}

export function createMuseumEnvironment(options: MuseumEnvironmentOptions = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = "museum-environment";
  const exhibitOffsetX = options.exhibitOffsetX ?? 0;
  const infoDisplayX = 2.05;
  const exhibit = new THREE.Group();
  exhibit.name = "artifact-exhibit";
  exhibit.position.x = exhibitOffsetX;
  exhibit.rotation.y = options.showInfoDisplay ? 0.35 : 0;

  const stone = new THREE.MeshStandardMaterial({ color: 0xd8d1c3, roughness: 0.88 });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x756d62, roughness: 0.78 });
  const brass = new THREE.MeshStandardMaterial({ color: 0x806b48, metalness: 0.55, roughness: 0.42 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xddeeff, transparent: true, opacity: 0.13, roughness: 0.08, transmission: 0.72, side: THREE.DoubleSide, depthWrite: false });

  const floor = receiveShadows(new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshStandardMaterial({ color: 0x292724, roughness: 0.94 })));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.55;
  floor.name = "floor";

  const platform = receiveShadows(new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.3, 0.22, 64), darkStone));
  platform.position.set(0, -1.43, 0);
  platform.name = "platform";

  const pedestal = receiveShadows(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.05, 1.5), stone));
  pedestal.position.set(0, -0.8, 0);
  pedestal.name = "pedestal";

  const caseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.45, 3.3, 2.45), glass);
  caseMesh.position.set(0, 0.55, 0);
  caseMesh.name = "glass-case";

  const plaqueTexture = createPlaqueTexture(options.plaqueTitle ?? "Artifact", options.plaqueOrigin ?? "Origin unknown");
  const plaqueMaterial = plaqueTexture ? new THREE.MeshStandardMaterial({ map: plaqueTexture, roughness: 0.9 }) : brass;
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.5), plaqueMaterial);
  plaque.position.set(0, -0.78, 0.758);
  plaque.name = "plaque";

  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xd9c8a8, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
  const wallGlow = new THREE.Mesh(new THREE.PlaneGeometry(options.showInfoDisplay ? 12.5 : 7, options.showInfoDisplay ? 6.5 : 5), glowMaterial);
  // Keep the rear display plane centred on the exhibit. The information panel
  // is a separate object and must not pull the artifact backdrop sideways.
  const backdropX = options.showInfoDisplay ? (exhibitOffsetX + infoDisplayX) / 2 - 0.6 : exhibitOffsetX;
  wallGlow.position.set(backdropX, options.showInfoDisplay ? 0.05 : 0.65, -3.6);
  wallGlow.name = "wall-glow";

  // A dimensional gallery signature: warm brass lettering mounted on the rear
  // wall, positioned as part of the exhibit instead of as a UI overlay.
  const brandTexture = createBrandTexture();
  const brandSign = new THREE.Group();
  brandSign.name = "viswaroop-gallery-sign";
  brandSign.position.set(backdropX, options.showInfoDisplay ? 2.32 : 2.45, -3.52);
  const signBacking = new THREE.Mesh(
    new THREE.PlaneGeometry(options.showInfoDisplay ? 5.7 : 4.8, 1.3),
    new THREE.MeshStandardMaterial({ color: 0x211f1c, roughness: 0.72, metalness: 0.08 }),
  );
  signBacking.name = "brand-sign-backing";
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(options.showInfoDisplay ? 3.15 : 2.85, options.showInfoDisplay ? 1.4 : 1.27),
    new THREE.MeshBasicMaterial({ map: brandTexture, transparent: true, toneMapped: false }),
  );
  signFace.name = "brand-sign-lettering";
  signFace.position.z = 0.012;
  brandSign.add(signBacking, signFace);

  if (options.showInfoDisplay) {
    const display = new THREE.Group();
    display.name = "museum-info-display";
    display.position.set(infoDisplayX, -0.02, 0.05);
    display.rotation.y = -0.24;

    const wood = new THREE.MeshStandardMaterial({ color: 0x765033, roughness: 0.72, metalness: 0.03 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x49301f, roughness: 0.8 });
    const infoTexture = options.panelDetails ? createInfoTexture(options.panelDetails) : null;
    const screen = new THREE.MeshStandardMaterial({ color: 0xd8d1c3, roughness: 0.82, metalness: 0.02 });
    const addBeam = (name: string, size: [number, number, number], position: [number, number, number], rotationZ = 0) => {
      const beam = receiveShadows(new THREE.Mesh(new THREE.BoxGeometry(...size), wood));
      beam.name = name;
      beam.position.set(...position);
      beam.rotation.z = rotationZ;
      beam.castShadow = true;
      display.add(beam);
    };

    const panel = receiveShadows(new THREE.Mesh(new THREE.BoxGeometry(1.86, 2.42, 0.12), screen));
    panel.name = "information-screen";
    panel.position.set(0, 0.42, 0);
    panel.castShadow = true;
    display.add(panel);
    if (infoTexture) {
      const frontSurface = new THREE.Mesh(
        new THREE.PlaneGeometry(1.84, 2.4),
        new THREE.MeshBasicMaterial({ color: 0xffffff, map: infoTexture, toneMapped: false }),
      );
      frontSurface.name = "information-screen-front";
      frontSurface.position.set(0, 0.42, 0.066);
      display.add(frontSurface);

      const mirroredTexture = infoTexture.clone();
      mirroredTexture.wrapS = THREE.RepeatWrapping;
      mirroredTexture.repeat.x = -1;
      mirroredTexture.offset.x = 1;
      mirroredTexture.needsUpdate = true;
      const rearSurface = new THREE.Mesh(
        new THREE.PlaneGeometry(1.84, 2.4),
        new THREE.MeshBasicMaterial({ color: 0xffffff, map: mirroredTexture, toneMapped: false }),
      );
      rearSurface.name = "information-screen-rear-mirrored";
      rearSurface.position.set(0, 0.42, -0.066);
      rearSurface.rotation.y = Math.PI;
      display.add(rearSurface);
    }

    addBeam("frame-top", [2.02, 0.12, 0.18], [0, 1.67, 0.02]);
    addBeam("frame-bottom", [2.02, 0.12, 0.18], [0, -0.83, 0.02]);
    addBeam("frame-left", [0.12, 2.42, 0.18], [-0.95, 0.42, 0.02]);
    addBeam("frame-right", [0.12, 2.42, 0.18], [0.95, 0.42, 0.02]);
    addBeam("left-leg", [0.13, 1.65, 0.16], [-0.66, -1.5, -0.12], -0.13);
    addBeam("right-leg", [0.13, 1.65, 0.16], [0.66, -1.5, -0.12], 0.13);
    addBeam("lower-brace", [1.55, 0.12, 0.15], [0, -1.46, -0.08]);
    addBeam("left-foot", [0.9, 0.12, 0.35], [-0.56, -2.24, 0.05]);
    addBeam("right-foot", [0.9, 0.12, 0.35], [0.56, -2.24, 0.05]);
    const shelf = receiveShadows(new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.13, 0.38), darkWood));
    shelf.name = "display-shelf";
    shelf.position.set(0, -0.78, 0.13);
    shelf.castShadow = true;
    display.add(shelf);
    group.add(display);
  }

  exhibit.add(platform, pedestal, caseMesh, plaque);
  group.add(floor, exhibit, wallGlow, brandSign);
  return group;
}
