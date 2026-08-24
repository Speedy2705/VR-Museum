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
import type { LightDirectionKey, LightTemperatureKey, LightingPresetKey } from "@/lib/artifact-categories";
import { buildLighting, getLightingPreset } from "@/lib/lighting-presets";
import { fitModelToExhibit } from "@/lib/three/fit-model-to-exhibit";
import { createMuseumEnvironment, MUSEUM_EXHIBIT_FIT, type MuseumPanelDetails } from "@/lib/three/museum-environment";
import { loadModel, type ModelFormat, type ModelLoadError } from "@/lib/three/loaders";

export type LightingStudioViewerProps = { src: string; format: ModelFormat; presetKey?: LightingPresetKey; lightTemperature?: LightTemperatureKey; lightDirection?: LightDirectionKey; title: string; poster?: string; onReady?: () => void; onError?: (message: string) => void; showMuseumEnvironment?: boolean; className?: string; museumLayout?: "centered" | "details"; focusArtifactWithExhibit?: boolean; plaqueOrigin?: string; panelDetails?: MuseumPanelDetails };
type CameraView = { position: THREE.Vector3; target: THREE.Vector3; minDistance: number; maxDistance: number };
type FocusMode = "both" | "artifact" | "details" | "custom";

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

function fittedDistance(box: THREE.Box3, camera: THREE.PerspectiveCamera, padding: number, minimum: number) {
  const size = box.getSize(new THREE.Vector3());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const verticalDistance = size.y / (2 * Math.tan(verticalFov / 2));
  const horizontalDistance = size.x / (2 * Math.tan(horizontalFov / 2));
  return Math.max(Math.max(verticalDistance, horizontalDistance) * padding + size.z / 2, minimum);
}

function frameObject(object: THREE.Object3D, camera: THREE.PerspectiveCamera, controls: OrbitControls, museumEnvironment: THREE.Group | null = null, detailsComposition = false): CameraView {
  object.updateWorldMatrix(true, true);
  museumEnvironment?.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  const museumComposition = Boolean(museumEnvironment);
  if (museumEnvironment) {
    ["platform", "pedestal", "glass-case", "museum-info-display"].forEach((name) => {
      const part = museumEnvironment.getObjectByName(name);
      if (part) box.expandByObject(part, true);
    });
  }
  const center = box.getCenter(new THREE.Vector3());
  const distance = fittedDistance(box, camera, detailsComposition ? 1.35 : museumComposition ? 1.28 : 1.4, museumComposition ? 7.5 : 2.4);
  camera.position.set(center.x + (museumComposition ? 0 : distance * 0.55), center.y + distance * (museumComposition ? 0.04 : 0.3), center.z + distance);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = Math.max(distance * 100, 100);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.minDistance = distance * 0.35;
  controls.maxDistance = distance * 4;
  controls.update();
  return { position: camera.position.clone(), target: controls.target.clone(), minDistance: controls.minDistance, maxDistance: controls.maxDistance };
}

export default function LightingStudioViewer({ src, format, presetKey = "raking-light", lightTemperature, lightDirection, title, poster, onReady, onError, showMuseumEnvironment = true, className = "", museumLayout = "centered", focusArtifactWithExhibit = false, plaqueOrigin, panelDetails }: LightingStudioViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControls>(null);
  const modelRef = useRef<THREE.Object3D>(null);
  const environmentRef = useRef<THREE.Group>(null);
  const originalViewRef = useRef<CameraView>(null);
  const cameraMoveRef = useRef<{ startedAt: number; fromPosition: THREE.Vector3; toPosition: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 }>(null);
  const reframeRef = useRef<(() => CameraView | null) | null>(null);
  const viewerReadyRef = useRef(false);
  const userInteractedRef = useRef(false);
  const focusedRef = useRef<FocusMode>("both");
  const rotatingRef = useRef(false);
  const presetRef = useRef(presetKey);
  const callbacksRef = useRef({ onReady, onError });
  const exhibitDetailsRef = useRef({ title, plaqueOrigin, panelDetails });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [focused, setFocused] = useState<FocusMode>("both");

  useEffect(() => { rotatingRef.current = rotating; }, [rotating]);
  useEffect(() => { focusedRef.current = focused; }, [focused]);
  useEffect(() => { callbacksRef.current = { onReady, onError }; }, [onReady, onError]);
  useEffect(() => { exhibitDetailsRef.current = { title, plaqueOrigin, panelDetails }; }, [title, plaqueOrigin, panelDetails]);
  useEffect(() => { presetRef.current = presetKey; }, [presetKey]);

  const moveCamera = useCallback((position: THREE.Vector3, target: THREE.Vector3) => {
    const camera = cameraRef.current; const controls = controlsRef.current;
    if (!camera || !controls) return;
    controls.enabled = false;
    controls.enableDamping = false;
    cameraMoveRef.current = { startedAt: performance.now(), fromPosition: camera.position.clone(), toPosition: position.clone(), fromTarget: controls.target.clone(), toTarget: target.clone() };
  }, []);

  const focusObject = useCallback((object: THREE.Object3D, kind: "artifact" | "details") => {
    const camera = cameraRef.current; const controls = controlsRef.current;
    if (!camera || !controls) return;
    const box = new THREE.Box3().setFromObject(object);
    const viewCenter = box.getCenter(new THREE.Vector3());
    const distance = fittedDistance(box, camera, kind === "artifact" ? 1.35 : 1.28, kind === "details" ? 3.8 : 2.4);
    const frontPosition = new THREE.Vector3(viewCenter.x, viewCenter.y + distance * 0.05, viewCenter.z + distance);
    controls.minDistance = distance * 0.4;
    controls.maxDistance = originalViewRef.current?.maxDistance ?? distance * 3;
    moveCamera(frontPosition, viewCenter);
    setRotating(false);
    setFocused(kind);
  }, [moveCamera]);

  const moveExhibit = useCallback((horizontal: number, vertical: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || cameraMoveRef.current) return;
    const distance = camera.position.distanceTo(controls.target);
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    const step = visibleHeight * 0.055;
    const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    const cameraOffset = cameraRight.multiplyScalar(-horizontal * step).add(cameraUp.multiplyScalar(-vertical * step));
    camera.position.add(cameraOffset);
    controls.target.add(cameraOffset);
    controls.update();
    userInteractedRef.current = true;
    focusedRef.current = "custom";
    setFocused("custom");
  }, []);

  const resetView = useCallback(() => {
    focusedRef.current = "both";
    userInteractedRef.current = false;
    const view = reframeRef.current?.() ?? originalViewRef.current;
    if (!view) return;
    if (controlsRef.current) {
      controlsRef.current.minDistance = view.minDistance;
      controlsRef.current.maxDistance = view.maxDistance;
    }
    moveCamera(view.position, view.target);
    setFocused("both");
  }, [moveCamera]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x242321);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000);
    camera.layers.enable(1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    const noteInteraction = () => { if (viewerReadyRef.current) userInteractedRef.current = true; };
    controls.addEventListener("start", noteInteraction);
    const exhibitOffsetX = museumLayout === "details" ? -2.35 : 0;
    const exhibitDetails = exhibitDetailsRef.current;
    const environment = showMuseumEnvironment ? createMuseumEnvironment({ exhibitOffsetX, plaqueTitle: exhibitDetails.title, plaqueOrigin: exhibitDetails.plaqueOrigin, showInfoDisplay: museumLayout === "details", panelDetails: exhibitDetails.panelDetails }) : null;
    if (environment) scene.add(environment);
    const environmentFill = new THREE.HemisphereLight(0xfff4e5, 0x292725, 1.35);
    environmentFill.layers.set(0);
    environmentFill.name = "museum-environment-light";
    scene.add(environmentFill);
    environmentRef.current = environment;
    sceneRef.current = scene; cameraRef.current = camera; controlsRef.current = controls;
    let resizeFrame = 0;
    const applyFullFrame = () => {
      const model = modelRef.current;
      const { width, height } = host.getBoundingClientRect();
      if (!model || !width || !height) return null;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const view = frameObject(model, camera, controls, showMuseumEnvironment ? environmentRef.current : null, museumLayout === "details");
      originalViewRef.current = view;
      if (!viewerReadyRef.current) {
        viewerReadyRef.current = true;
        controls.enabled = true;
        setProgress(100);
        setLoaded(true);
        callbacksRef.current.onReady?.();
      }
      return view;
    };
    reframeRef.current = applyFullFrame;
    const restoreCenteredView = () => {
      if (!modelRef.current || focusedRef.current !== "both" || userInteractedRef.current || cameraMoveRef.current) return;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => { applyFullFrame(); });
    };
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (!modelRef.current || focusedRef.current !== "both" || cameraMoveRef.current) return;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => { applyFullFrame(); });
    });
    observer.observe(host);
    window.addEventListener("pageshow", restoreCenteredView);
    window.addEventListener("load", restoreCenteredView);
    window.visualViewport?.addEventListener("resize", restoreCenteredView);
    let frame = 0;
    const animate = (now: number) => {
      const move = cameraMoveRef.current;
      if (move) {
        const progress = Math.min((now - move.startedAt) / 650, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(move.fromPosition, move.toPosition, eased);
        controls.target.lerpVectors(move.fromTarget, move.toTarget, eased);
        if (progress === 1) { controls.update(); controls.enableDamping = true; cameraMoveRef.current = null; controls.enabled = true; }
      }
      controls.autoRotate = rotatingRef.current && !move; controls.autoRotateSpeed = 1.6; controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(resizeFrame); observer.disconnect(); window.removeEventListener("pageshow", restoreCenteredView); window.removeEventListener("load", restoreCenteredView); window.visualViewport?.removeEventListener("resize", restoreCenteredView); controls.removeEventListener("start", noteInteraction); controls.dispose(); if (modelRef.current) disposeObject(modelRef.current); if (environment) disposeObject(environment); renderer.dispose(); renderer.domElement.remove(); sceneRef.current = null; cameraRef.current = null; controlsRef.current = null; modelRef.current = null; environmentRef.current = null; cameraMoveRef.current = null; reframeRef.current = null; viewerReadyRef.current = false; userInteractedRef.current = false; };
  }, [showMuseumEnvironment, museumLayout, focusObject]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.children.filter((child) => child.userData.artifactLight || child.name === "artifact-light-target" || child.name === "artifact-spotlight-target").forEach((child) => scene.remove(child));
    const artifactCenter = modelRef.current
      ? new THREE.Box3().setFromObject(modelRef.current).getCenter(new THREE.Vector3())
      : new THREE.Vector3();
    const activeLights = lightTemperature && lightDirection ? buildLighting(scene, lightTemperature, lightDirection, artifactCenter) : getLightingPreset(presetKey).build(scene, artifactCenter);
    activeLights.forEach((light: THREE.Light) => { light.castShadow = true; });
    const hint = getLightingPreset(presetKey).fallbackMaterial;
    modelRef.current?.traverse((child) => { if (child instanceof THREE.Mesh && child.userData.usesPresetFallbackMaterial) { const old = child.material as THREE.Material; child.material = new THREE.MeshStandardMaterial({ ...hint }); disposeMaterial(old); } });
  }, [presetKey, lightTemperature, lightDirection, loaded]);

  useEffect(() => {
    const scene = sceneRef.current; const camera = cameraRef.current; const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;
    let active = true;
    const settleTimers: number[] = [];
    viewerReadyRef.current = false;
    userInteractedRef.current = false;
    originalViewRef.current = null;
    controls.enabled = false;
    setLoaded(false); setFailed(false); setProgress(8);
    const timer = window.setInterval(() => setProgress((value) => Math.min(value + Math.max(1, Math.round((90 - value) / 8)), 90)), 180);
    loadModel(src, format, presetRef.current).then((object) => {
      if (!active) { disposeObject(object); return; }
      if (modelRef.current) { scene.remove(modelRef.current); disposeObject(modelRef.current); }
      object.traverse((child) => { child.layers.set(1); if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; } });
      const exhibitCenterX = museumLayout === "details" ? -2.35 : 0;
      fitModelToExhibit(object, {
        ...MUSEUM_EXHIBIT_FIT,
        centerX: exhibitCenterX,
        centerZ: 0,
        platformRotationY: environmentRef.current?.getObjectByName("artifact-exhibit")?.rotation.y ?? 0,
      });
      modelRef.current = object;
      scene.add(object);
      controls.enabled = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!active || modelRef.current !== object) return;
          reframeRef.current?.();
          for (const delay of [150, 500, 1200]) {
            settleTimers.push(window.setTimeout(() => {
              if (active && focusedRef.current === "both" && !userInteractedRef.current && !cameraMoveRef.current) reframeRef.current?.();
            }, delay));
          }
        });
      });
    }).catch((error: ModelLoadError) => { if (!active) return; const message = error.message || "The model file may be missing or no longer available."; setFailed(true); callbacksRef.current.onError?.(message); }).finally(() => window.clearInterval(timer));
    return () => { active = false; window.clearInterval(timer); settleTimers.forEach(window.clearTimeout); if (modelRef.current) { scene.remove(modelRef.current); disposeObject(modelRef.current); modelRef.current = null; } };
  }, [src, format, showMuseumEnvironment, museumLayout]);

  if (failed) return <div role="alert" className={`relative flex h-full items-center justify-center overflow-hidden bg-cream-dark p-8 text-center ${className}`}>{poster && <div className="absolute inset-0 opacity-35"><PlaceholderImage src={poster} alt={title} label={title} sizes="(min-width: 768px) 50vw, 100vw" /></div>}<div className="relative"><p className="font-display text-2xl italic">The model is unavailable</p><p className="mt-3 text-sm text-stone">We couldn’t prepare this 3D view. Try the artifact photo instead.</p></div></div>;
  return <div className={`relative h-full min-h-64 w-full overflow-hidden bg-cream-dark ${className}`}><div ref={hostRef} className="absolute inset-0" aria-label={`Interactive 3D model of ${title}`} />{!loaded && <div className="pointer-events-none absolute inset-x-5 bottom-5" role="status" aria-label={`Loading 3D model: ${progress}%`}><div className="h-px bg-cream/30"><span className="block h-full bg-cream transition-[width]" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-[9px] tracking-label text-cream/75 uppercase">Preparing 3D view · {progress}%</p></div>}{loaded && <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-end gap-3"><div className="flex flex-wrap gap-2"><button type="button" aria-pressed={rotating} onClick={() => setRotating((value) => !value)} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">{rotating ? "Stop rotation" : "Auto rotate"}</button>{museumLayout === "details" ? <><button type="button" aria-pressed={focused === "artifact"} onClick={() => { const exhibit = environmentRef.current?.getObjectByName("artifact-exhibit"); const target = focusArtifactWithExhibit ? exhibit ?? modelRef.current : modelRef.current; if (target) focusObject(target, "artifact"); }} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">Focus artifact</button><button type="button" aria-pressed={focused === "details"} onClick={() => { const display = environmentRef.current?.getObjectByName("museum-info-display"); if (display) focusObject(display, "details"); }} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">View details</button><button type="button" aria-pressed={focused === "both"} onClick={resetView} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">View all</button></> : <button type="button" aria-pressed={focused === "both"} onClick={resetView} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">Focus artifact</button>}</div><div role="group" aria-label="Move 3D exhibit" className="grid grid-cols-3 gap-1"><span aria-hidden="true" /><button type="button" aria-label="Move exhibit up" title="Move up" onClick={() => moveExhibit(0, 1)} className="flex size-9 items-center justify-center bg-cream/95 text-base text-ink shadow transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">↑</button><span aria-hidden="true" /><button type="button" aria-label="Move exhibit left" title="Move left" onClick={() => moveExhibit(-1, 0)} className="flex size-9 items-center justify-center bg-cream/95 text-base text-ink shadow transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">←</button><button type="button" aria-label="Center exhibit" title="Center view" onClick={resetView} className="flex size-9 items-center justify-center bg-cream/95 text-sm text-ink shadow transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">●</button><button type="button" aria-label="Move exhibit right" title="Move right" onClick={() => moveExhibit(1, 0)} className="flex size-9 items-center justify-center bg-cream/95 text-base text-ink shadow transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">→</button><span aria-hidden="true" /><button type="button" aria-label="Move exhibit down" title="Move down" onClick={() => moveExhibit(0, -1)} className="flex size-9 items-center justify-center bg-cream/95 text-base text-ink shadow transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">↓</button><span aria-hidden="true" /></div></div>}</div>;
}
