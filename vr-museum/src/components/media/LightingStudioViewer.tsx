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
import { createMuseumEnvironment } from "@/lib/three/museum-environment";
import { loadModel, type ModelFormat, type ModelLoadError } from "@/lib/three/loaders";

export type LightingStudioViewerProps = { src: string; format: ModelFormat; presetKey: LightingPresetKey; title: string; poster?: string; onReady?: () => void; onError?: (message: string) => void; showMuseumEnvironment?: boolean; className?: string };

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

function frameObject(object: THREE.Object3D, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z) || 1;
  const distance = longest / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.45;
  camera.position.set(center.x + distance * 0.55, center.y + distance * 0.3, center.z + distance);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = Math.max(distance * 100, 100);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.minDistance = distance * 0.35;
  controls.maxDistance = distance * 4;
  controls.update();
}

export default function LightingStudioViewer({ src, format, presetKey, title, poster, onReady, onError, showMuseumEnvironment = true, className = "" }: LightingStudioViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControls>(null);
  const modelRef = useRef<THREE.Object3D>(null);
  const originalViewRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 }>(null);
  const rotatingRef = useRef(false);
  const presetRef = useRef(presetKey);
  const callbacksRef = useRef({ onReady, onError });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rotating, setRotating] = useState(false);

  useEffect(() => { rotatingRef.current = rotating; }, [rotating]);
  useEffect(() => { callbacksRef.current = { onReady, onError }; }, [onReady, onError]);
  useEffect(() => { presetRef.current = presetKey; }, [presetKey]);

  const resetView = useCallback(() => {
    const view = originalViewRef.current;
    if (!view || !cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.copy(view.position);
    controlsRef.current.target.copy(view.target);
    controlsRef.current.update();
  }, []);

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
    const environment = showMuseumEnvironment ? createMuseumEnvironment() : null;
    if (environment) scene.add(environment);
    sceneRef.current = scene; cameraRef.current = camera; controlsRef.current = controls;
    const observer = new ResizeObserver(([entry]) => { const { width, height } = entry.contentRect; if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); });
    observer.observe(host);
    let frame = 0;
    const animate = () => { controls.autoRotate = rotatingRef.current; controls.autoRotateSpeed = 1.2; controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(animate); };
    animate();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); if (modelRef.current) disposeObject(modelRef.current); if (environment) disposeObject(environment); renderer.dispose(); renderer.domElement.remove(); sceneRef.current = null; cameraRef.current = null; controlsRef.current = null; modelRef.current = null; };
  }, [showMuseumEnvironment]);

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
      modelRef.current = object; scene.add(object); frameObject(object, camera, controls);
      originalViewRef.current = { position: camera.position.clone(), target: controls.target.clone() };
      setProgress(100); setLoaded(true); callbacksRef.current.onReady?.();
    }).catch((error: ModelLoadError) => { if (!active) return; const message = error.message || "The model file may be missing or no longer available."; setFailed(true); callbacksRef.current.onError?.(message); }).finally(() => window.clearInterval(timer));
    return () => { active = false; window.clearInterval(timer); if (modelRef.current) { scene.remove(modelRef.current); disposeObject(modelRef.current); modelRef.current = null; } };
  }, [src, format, showMuseumEnvironment]);

  if (failed) return <div role="alert" className={`relative flex h-full items-center justify-center overflow-hidden bg-cream-dark p-8 text-center ${className}`}>{poster && <div className="absolute inset-0 opacity-35"><PlaceholderImage src={poster} alt={title} label={title} sizes="(min-width: 768px) 50vw, 100vw" /></div>}<div className="relative"><p className="font-display text-2xl italic">The model is unavailable</p><p className="mt-3 text-sm text-stone">We couldn’t prepare this 3D view. Try the artifact photo instead.</p></div></div>;
  return <div className={`relative h-full min-h-64 w-full overflow-hidden bg-cream-dark ${className}`}><div ref={hostRef} className="absolute inset-0" aria-label={`Interactive 3D model of ${title}`} />{!loaded && <div className="pointer-events-none absolute inset-x-5 bottom-5" role="status" aria-label={`Loading 3D model: ${progress}%`}><div className="h-px bg-cream/30"><span className="block h-full bg-cream transition-[width]" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-[9px] tracking-label text-cream/75 uppercase">Preparing 3D view · {progress}%</p></div>}{loaded && <div className="absolute bottom-3 left-3 flex gap-2"><button type="button" aria-pressed={rotating} onClick={() => setRotating((value) => !value)} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">{rotating ? "Stop rotation" : "Auto rotate"}</button><button type="button" onClick={resetView} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">Reset view</button></div>}</div>;
}
