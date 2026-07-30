"use client";

/*
Manual smoke test: open any existing /uploads/*.glb and switch through all five
presets; each should visibly change direction, colour, and/or intensity without a
second model request. Test OBJ and STL loading with external sample files: this
repository currently contains no OBJ or STL fixtures.
*/
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import type { LightingPresetKey } from "@/lib/artifact-categories";
import { getLightingPreset } from "@/lib/lighting-presets";
import { createMuseumEnvironment, type MuseumPanelDetails } from "@/lib/three/museum-environment";
import { loadModel, type ModelFormat, type ModelLoadError } from "@/lib/three/loaders";

export type LightingStudioViewerProps = { src: string; format: ModelFormat; presetKey: LightingPresetKey; title: string; poster?: string; onReady?: () => void; onError?: (message: string) => void; showMuseumEnvironment?: boolean; className?: string; museumLayout?: "centered" | "details"; plaqueOrigin?: string; panelDetails?: MuseumPanelDetails };

function disposeMaterial(material: THREE.Material) {
  for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
  material.dispose();
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry?.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach(disposeMaterial);
  });
}

function frameObject(object: THREE.Object3D, camera: THREE.PerspectiveCamera, controls: OrbitControls, museumComposition = false) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z) || 1;
  const fittedDistance = longest / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.45;
  const distance = museumComposition ? Math.max(fittedDistance * 1.25, 7.5) : fittedDistance;
  const compositionOffset = museumComposition ? 2.1 : 0;
  camera.position.set(center.x + compositionOffset + (museumComposition ? 0 : distance * 0.55), center.y + distance * (museumComposition ? 0.12 : 0.3), center.z + distance);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = Math.max(distance * 100, 100);
  camera.updateProjectionMatrix();
  controls.target.copy(center).add(new THREE.Vector3(compositionOffset, 0, 0));
  controls.minDistance = distance * 0.35;
  controls.maxDistance = museumComposition ? distance * 1.02 : distance * 4;
  controls.update();
}

export default function LightingStudioViewer({ src, format, presetKey, title, poster, onReady, onError, showMuseumEnvironment = true, className = "", museumLayout = "centered", plaqueOrigin, panelDetails }: LightingStudioViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControls>(null);
  const modelRef = useRef<THREE.Object3D>(null);
  const environmentRef = useRef<THREE.Group>(null);
  const originalViewRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 }>(null);
  const cameraMoveRef = useRef<{ startedAt: number; fromPosition: THREE.Vector3; toPosition: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 }>(null);
  const rotatingRef = useRef(false);
  const presetRef = useRef(presetKey);
  const callbacksRef = useRef({ onReady, onError });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [focused, setFocused] = useState<"both" | "artifact" | "details">("both");

  useEffect(() => { rotatingRef.current = rotating; }, [rotating]);
  useEffect(() => { callbacksRef.current = { onReady, onError }; }, [onReady, onError]);
  useEffect(() => { presetRef.current = presetKey; }, [presetKey]);

  const moveCamera = useCallback((position: THREE.Vector3, target: THREE.Vector3) => {
    const camera = cameraRef.current; const controls = controlsRef.current;
    if (!camera || !controls) return;
    controls.enabled = false;
    cameraMoveRef.current = { startedAt: performance.now(), fromPosition: camera.position.clone(), toPosition: position.clone(), fromTarget: controls.target.clone(), toTarget: target.clone() };
  }, []);

  const focusObject = useCallback((object: THREE.Object3D, kind: "artifact" | "details") => {
    const camera = cameraRef.current; const controls = controlsRef.current;
    if (!camera || !controls) return;
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;
    const distance = Math.max(longest / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.35, kind === "details" ? 3.8 : 2.4);
    const direction = camera.position.clone().sub(controls.target).normalize();
    moveCamera(center.clone().add(direction.multiplyScalar(distance)), center);
    setFocused(kind);
  }, [moveCamera]);

  const resetView = useCallback(() => {
    const view = originalViewRef.current;
    if (!view) return;
    moveCamera(view.position, view.target);
    setFocused("both");
  }, [moveCamera]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x242321);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    const exhibitOffsetX = museumLayout === "details" ? -2.15 : 0;
    const environment = showMuseumEnvironment ? createMuseumEnvironment({ exhibitOffsetX, plaqueTitle: title, plaqueOrigin, showInfoDisplay: museumLayout === "details", panelDetails }) : null;
    if (environment) scene.add(environment);
    environmentRef.current = environment;
    sceneRef.current = scene; cameraRef.current = camera; controlsRef.current = controls;
    const observer = new ResizeObserver(([entry]) => { const { width, height } = entry.contentRect; if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); });
    observer.observe(host);
    let frame = 0;
    const animate = (now: number) => {
      const move = cameraMoveRef.current;
      if (move) {
        const progress = Math.min((now - move.startedAt) / 650, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(move.fromPosition, move.toPosition, eased);
        controls.target.lerpVectors(move.fromTarget, move.toTarget, eased);
        if (progress === 1) { cameraMoveRef.current = null; controls.enabled = true; }
      }
      controls.autoRotate = rotatingRef.current && !move; controls.autoRotateSpeed = 1.6; controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(animate);
    };
    const pointerStart = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => pointerStart.set(event.clientX, event.clientY);
    const onPointerUp = (event: PointerEvent) => {
      if (pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 6) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      const belongsTo = (child: THREE.Object3D, parent: THREE.Object3D | null) => { let current: THREE.Object3D | null = child; while (current) { if (current === parent) return true; current = current.parent; } return false; };
      const detailsDisplay = environment?.getObjectByName("museum-info-display") ?? null;
      const artifactHit = hits.some(({ object }) => belongsTo(object, modelRef.current));
      const detailsHit = detailsDisplay && hits.some(({ object }) => belongsTo(object, detailsDisplay));
      if (artifactHit && modelRef.current) focusObject(modelRef.current, "artifact");
      else if (detailsHit && detailsDisplay) focusObject(detailsDisplay, "details");
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); renderer.domElement.removeEventListener("pointerdown", onPointerDown); renderer.domElement.removeEventListener("pointerup", onPointerUp); controls.dispose(); if (modelRef.current) disposeObject(modelRef.current); if (environment) disposeObject(environment); renderer.dispose(); renderer.domElement.remove(); sceneRef.current = null; cameraRef.current = null; controlsRef.current = null; modelRef.current = null; environmentRef.current = null; cameraMoveRef.current = null; };
  }, [showMuseumEnvironment, museumLayout, title, plaqueOrigin, panelDetails, focusObject]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.children.filter((child): child is THREE.Light => child instanceof THREE.Light).forEach((light) => scene.remove(light));
    getLightingPreset(presetKey).build(scene).forEach((light) => { light.castShadow = true; });
    const hint = getLightingPreset(presetKey).fallbackMaterial;
    modelRef.current?.traverse((child) => { if (child instanceof THREE.Mesh && child.userData.usesPresetFallbackMaterial) { const old = child.material as THREE.Material; child.material = new THREE.MeshStandardMaterial({ ...hint }); disposeMaterial(old); } });
  }, [presetKey, loaded]);

  useEffect(() => {
    const scene = sceneRef.current; const camera = cameraRef.current; const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;
    let active = true;
    setLoaded(false); setFailed(false); setProgress(8);
    const timer = window.setInterval(() => setProgress((value) => Math.min(value + Math.max(1, Math.round((90 - value) / 8)), 90)), 180);
    loadModel(src, format, presetRef.current).then((object) => {
      if (!active) { disposeObject(object); return; }
      if (modelRef.current) { scene.remove(modelRef.current); disposeObject(modelRef.current); }
      object.traverse((child) => { if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; } });
      object.position.x += museumLayout === "details" ? -2.15 : 0;
      modelRef.current = object; scene.add(object); frameObject(object, camera, controls, museumLayout === "details");
      originalViewRef.current = { position: camera.position.clone(), target: controls.target.clone() };
      setProgress(100); setLoaded(true); callbacksRef.current.onReady?.();
    }).catch((error: ModelLoadError) => { if (!active) return; const message = error.message || "The model file may be missing or no longer available."; setFailed(true); callbacksRef.current.onError?.(message); }).finally(() => window.clearInterval(timer));
    return () => { active = false; window.clearInterval(timer); if (modelRef.current) { scene.remove(modelRef.current); disposeObject(modelRef.current); modelRef.current = null; } };
  }, [src, format, showMuseumEnvironment, museumLayout]);

  if (failed) return <div role="alert" className={`relative flex h-full items-center justify-center overflow-hidden bg-cream-dark p-8 text-center ${className}`}>{poster && <div className="absolute inset-0 opacity-35"><PlaceholderImage src={poster} alt={title} label={title} sizes="(min-width: 768px) 50vw, 100vw" /></div>}<div className="relative"><p className="font-display text-2xl italic">The model is unavailable</p><p className="mt-3 text-sm text-stone">We couldn’t prepare this 3D view. Try the artifact photo instead.</p></div></div>;
  return <div className={`relative h-full min-h-64 w-full overflow-hidden bg-cream-dark ${className}`}><div ref={hostRef} className="absolute inset-0" aria-label={`Interactive 3D model of ${title}`} />{!loaded && <div className="pointer-events-none absolute inset-x-5 bottom-5" role="status" aria-label={`Loading 3D model: ${progress}%`}><div className="h-px bg-cream/30"><span className="block h-full bg-cream transition-[width]" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-[9px] tracking-label text-cream/75 uppercase">Preparing 3D view · {progress}%</p></div>}{loaded && <div className="absolute bottom-3 left-3 flex flex-wrap gap-2"><button type="button" aria-pressed={rotating} onClick={() => setRotating((value) => !value)} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">{rotating ? "Stop rotation" : "Auto rotate"}</button>{museumLayout === "details" && <><button type="button" aria-pressed={focused === "artifact"} onClick={() => modelRef.current && focusObject(modelRef.current, "artifact")} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">Focus artifact</button><button type="button" aria-pressed={focused === "details"} onClick={() => { const display = environmentRef.current?.getObjectByName("museum-info-display"); if (display) focusObject(display, "details"); }} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">Focus details</button></>}<button type="button" aria-pressed={focused === "both"} onClick={resetView} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">Reset view</button></div>}</div>;
}
