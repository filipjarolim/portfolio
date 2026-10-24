"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CoreSpiral } from "@/components/core-spiral";
import type { Camera, Mesh, Object3D, PerspectiveCamera } from "three";
import { Box3, BoxGeometry, Group, Mesh as SolidMesh, MeshStandardMaterial, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const DRACO = "/draco/";

export type DeviceKind = "macbook" | "iphone";

const devices = {
  macbook: {
    model: "/models/macbook-air-m2.glb",
    screen: "Object_4",
    draco: false,
    /** Local axes of the glass: width, up the lid, out toward the keyboard. */
    right: [1, 0, 0],
    up: [0, 0, 1],
    out: [0, -1, 0],
    cssWidth: 960,
    radius: "2.2%",
    rotation: [0.42, 0.55, 0] as [number, number, number],
    front: [0, 0, 0] as [number, number, number],
  },
  iphone: {
    model: "/models/iphone-15-pro-max.glb",
    screen: "xXDHkMplTIDAXLN",
    draco: true,
    right: [-1, 0, 0],
    up: [0, 1, 0],
    out: [0, 0, -1],
    cssWidth: 430,
    radius: "11%",
    rotation: [0.16, Math.PI + 0.42, 0] as [number, number, number],
    front: [0, Math.PI, 0] as [number, number, number],
  },
} as const;

type Axis = readonly [number, number, number];
type Point = { x: number; y: number };

/**
 * Homography from four source pixels to four destination pixels.
 * Returns the eight coefficients with h22 fixed at 1, or null if the
 * quad is degenerate.
 */
const gauss = new Float64Array(72);
const coeff = new Float64Array(8);

function homography(src: Point[], dst: Point[]): Float64Array | null {
  gauss.fill(0);
  for (let i = 0; i < 4; i++) {
    const x = src[i].x;
    const y = src[i].y;
    const u = dst[i].x;
    const v = dst[i].y;
    const top = i * 18;
    const bottom = top + 9;
    gauss[top] = x;
    gauss[top + 1] = y;
    gauss[top + 2] = 1;
    gauss[top + 6] = -u * x;
    gauss[top + 7] = -u * y;
    gauss[top + 8] = u;
    gauss[bottom + 3] = x;
    gauss[bottom + 4] = y;
    gauss[bottom + 5] = 1;
    gauss[bottom + 6] = -v * x;
    gauss[bottom + 7] = -v * y;
    gauss[bottom + 8] = v;
  }

  for (let col = 0; col < 8; col++) {
    let pivot = col;
    let pivotAbs = Math.abs(gauss[col * 9 + col]);
    for (let row = col + 1; row < 8; row++) {
      const value = Math.abs(gauss[row * 9 + col]);
      if (value > pivotAbs) {
        pivot = row;
        pivotAbs = value;
      }
    }
    if (pivotAbs < 1e-10) return null;
    if (pivot !== col) {
      const from = col * 9;
      const swap = pivot * 9;
      for (let index = col; index < 9; index++) {
        const hold = gauss[from + index];
        gauss[from + index] = gauss[swap + index];
        gauss[swap + index] = hold;
      }
    }
    const base = col * 9;
    const scale = gauss[base + col];
    for (let index = col; index < 9; index++) gauss[base + index] /= scale;
    for (let row = 0; row < 8; row++) {
      if (row === col) continue;
      const factor = gauss[row * 9 + col];
      if (factor === 0) continue;
      const rowBase = row * 9;
      for (let index = col; index < 9; index++) {
        gauss[rowBase + index] -= factor * gauss[base + index];
      }
    }
  }

  for (let index = 0; index < 8; index++) coeff[index] = gauss[index * 9 + 8];
  return coeff;
}

function sealScreen(iframe: HTMLIFrameElement) {
  const block = (event: Event) => event.preventDefault();
  try {
    const doc = iframe.contentDocument;
    if (!doc || doc.getElementById("screen-lock")) return;
    const style = doc.createElement("style");
    style.id = "screen-lock";
    style.textContent =
      "html,body,body *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}";
    (doc.head ?? doc.documentElement).appendChild(style);
    doc.addEventListener("contextmenu", block);
    doc.addEventListener("selectstart", block);
    doc.addEventListener("dragstart", block);
  } catch {
    // A framed page on another origin cannot be locked from here.
  }
}

/** The keyboard deck is an open shell. This plate closes the underside. */
function sealKeyboardDeck(scene: Object3D) {
  const keyboard = scene.getObjectByName("Object_3");
  const parent = keyboard?.parent ?? scene;
  const plate = new SolidMesh(
    new BoxGeometry(2.96, 2.06, 0.07),
    new MeshStandardMaterial({
      color: "#141518",
      metalness: 0.5,
      roughness: 0.48,
    }),
  );
  plate.name = "keyboard-underside";
  plate.position.set(0, 0, -0.08);
  parent.add(plate);
}

function tuneTextures(root: Object3D, anisotropy: number) {
  root.traverse((object) => {
    const mesh = object as SolidMesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const mat = material as MeshStandardMaterial;
      if (!mat?.map) continue;
      mat.map.anisotropy = anisotropy;
      mat.map.needsUpdate = true;
    }
  });
}

function cssMatrix3d(h: Float64Array) {
  const [h00, h01, h02, h10, h11, h12, h20, h21] = h;
  return `matrix3d(${h00},${h10},0,${h20},${h01},${h11},0,${h21},0,0,1,0,${h02},${h12},0,1)`;
}

function projectToCanvas(
  point: Vector3,
  camera: Camera,
  width: number,
  height: number,
  view: Vector3,
  ndc: Vector3,
  out: Point & { behind: boolean },
) {
  view.copy(point).applyMatrix4(camera.matrixWorldInverse);
  ndc.copy(point).project(camera);
  out.x = (ndc.x * 0.5 + 0.5) * width;
  out.y = (-ndc.y * 0.5 + 0.5) * height;
  out.behind = view.z > -0.05;
}

const CORNERS: readonly (readonly [number, number])[] = [
  [-0.5, 0.5],
  [0.5, 0.5],
  [0.5, -0.5],
  [-0.5, -0.5],
];

type Scratch = {
  right: Vector3;
  up: Vector3;
  out: Vector3;
  center: Vector3;
  corner: Vector3;
  view: Vector3;
  ndc: Vector3;
  cameraPos: Vector3;
  localCenter: Vector3;
  prev: Float32Array;
  primed: boolean;
  viewW: number;
  viewH: number;
  faceWidth: number;
  faceHeight: number;
  lastTransform: string;
  lastVisible: boolean | null;
  quad: Float64Array;
  projected: (Point & { behind: boolean })[];
  source: Point[];
};

function makeScratch(): Scratch {
  return {
    right: new Vector3(),
    up: new Vector3(),
    out: new Vector3(),
    center: new Vector3(),
    corner: new Vector3(),
    view: new Vector3(),
    ndc: new Vector3(),
    cameraPos: new Vector3(),
    localCenter: new Vector3(),
    prev: new Float32Array(32),
    primed: false,
    viewW: 0,
    viewH: 0,
    faceWidth: 1,
    faceHeight: 1,
    lastTransform: "",
    lastVisible: null,
    quad: new Float64Array(8),
    projected: [
      { x: 0, y: 0, behind: false },
      { x: 0, y: 0, behind: false },
      { x: 0, y: 0, behind: false },
      { x: 0, y: 0, behind: false },
    ],
    source: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
  };
}

function ProjectedScreen({
  mesh,
  src,
  title,
  right,
  up,
  out,
  cssWidth,
  radius,
  interactive,
}: {
  mesh: Mesh;
  src: string;
  title: string;
  right: Axis;
  up: Axis;
  out: Axis;
  cssWidth: number;
  radius: string;
  interactive: boolean;
}) {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const host = useRef<HTMLDivElement | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);
  const scratch = useRef<Scratch>(null);
  if (!scratch.current) scratch.current = makeScratch();

  useLayoutEffect(() => {
    const bag = scratch.current;
    if (!bag) return;
    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox;
    if (!bounds) return;
    const size = new Vector3();
    bounds.getSize(size);
    bounds.getCenter(bag.localCenter);
    bag.right.set(right[0], right[1], right[2]);
    bag.up.set(up[0], up[1], up[2]);
    bag.out.set(out[0], out[1], out[2]);
    bag.faceWidth = Math.abs(size.dot(bag.right));
    bag.faceHeight = Math.abs(size.dot(bag.up));
    bag.primed = false;
    bag.quad.fill(0);
    invalidate();
  }, [mesh, right, up, out, invalidate]);

  useLayoutEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    parent.style.position = "relative";
    gl.domElement.style.position = "relative";
    gl.domElement.style.zIndex = "0";

    const layer = document.createElement("div");
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.overflow = "visible";
    layer.style.pointerEvents = "none";
    layer.style.zIndex = "2";

    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = "0";
    el.style.top = "0";
    el.style.transformOrigin = "0 0";
    el.style.overflow = "hidden";
    el.style.background = "#000";
    el.style.pointerEvents = "none";
    el.style.borderRadius = radius;
    el.style.willChange = "transform";
    el.style.userSelect = "none";
    el.style.setProperty("-webkit-user-select", "none");
    el.style.setProperty("-webkit-touch-callout", "none");
    el.addEventListener("contextmenu", (event) => event.preventDefault());

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.background = "#fff";
    iframe.style.transition = "opacity 180ms linear";
    iframe.addEventListener("load", () => {
      sealScreen(iframe);
      iframe.style.opacity = "1";
    });
    el.appendChild(iframe);
    layer.appendChild(el);
    parent.appendChild(layer);
    host.current = layer;
    frame.current = el;
    invalidate();

    return () => {
      layer.remove();
      host.current = null;
      frame.current = null;
    };
  }, [gl, radius, invalidate]);

  useLayoutEffect(() => {
    const el = frame.current;
    const iframe = el?.querySelector("iframe");
    if (!el || !iframe) return;
    iframe.title = title;
    const previous = iframe.getAttribute("src");
    if (previous === src) return;
    if (!previous || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      iframe.src = src;
      iframe.style.opacity = "1";
      return;
    }
    iframe.style.opacity = "0";
    const timer = window.setTimeout(() => {
      iframe.src = src;
    }, 160);
    return () => window.clearTimeout(timer);
  }, [src, title]);

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const value = interactive ? "auto" : "none";
    el.style.pointerEvents = value;
    const iframe = el.querySelector("iframe");
    if (iframe) iframe.style.pointerEvents = value;
  }, [interactive]);

  useFrame(() => {
    const el = frame.current;
    const bag = scratch.current;
    if (!el || !bag || bag.faceWidth < 1e-6 || bag.faceHeight < 1e-6) return;

    camera.updateMatrixWorld();
    mesh.updateWorldMatrix(true, false);
    const viewWidth = gl.domElement.clientWidth;
    const viewHeight = gl.domElement.clientHeight;
    if (viewWidth < 2 || viewHeight < 2) return;

    const cam = camera.matrixWorld.elements;
    const world = mesh.matrixWorld.elements;
    let moved = !bag.primed || bag.viewW !== viewWidth || bag.viewH !== viewHeight;
    if (!moved) {
      const prev = bag.prev;
      for (let i = 0; i < 16; i++) {
        if (Math.abs(prev[i] - cam[i]) > 1e-5 || Math.abs(prev[i + 16] - world[i]) > 1e-5) {
          moved = true;
          break;
        }
      }
    }
    if (!moved) return;
    bag.prev.set(cam);
    bag.prev.set(world, 16);
    bag.primed = true;
    bag.viewW = viewWidth;
    bag.viewH = viewHeight;

    const { right: rightAxis, up: upAxis, out: outAxis, corner, center } = bag;
    const faceWidth = bag.faceWidth;
    const faceHeight = bag.faceHeight;
    const cssHeight = Math.max(1, Math.round(cssWidth / (faceWidth / faceHeight)));

    const toWorld = (x: number, y: number, target: Vector3) =>
      mesh.localToWorld(
        target
          .copy(bag.localCenter)
          .addScaledVector(rightAxis, x * faceWidth)
          .addScaledVector(upAxis, y * faceHeight),
      );

    toWorld(0, 0, center);
    const normal = bag.ndc.copy(outAxis).transformDirection(mesh.matrixWorld);
    const facingCamera = normal.dot(camera.getWorldPosition(bag.cameraPos).sub(center)) > 0;

    let visible = facingCamera;
    for (let i = 0; i < CORNERS.length; i++) {
      const [x, y] = CORNERS[i];
      toWorld(x, y, corner);
      projectToCanvas(corner, camera, viewWidth, viewHeight, bag.view, bag.ndc, bag.projected[i]);
      if (bag.projected[i].behind) visible = false;
    }

    if (bag.lastVisible !== visible) {
      el.style.visibility = visible ? "visible" : "hidden";
      bag.lastVisible = visible;
    }
    const widthPx = `${cssWidth}px`;
    const heightPx = `${cssHeight}px`;
    if (el.style.width !== widthPx) el.style.width = widthPx;
    if (el.style.height !== heightPx) el.style.height = heightPx;
    if (!visible) return;

    let parked = true;
    for (let i = 0; i < 4; i++) {
      const x = Math.round(bag.projected[i].x);
      const y = Math.round(bag.projected[i].y);
      if (bag.quad[i * 2] !== x || bag.quad[i * 2 + 1] !== y) parked = false;
      bag.projected[i].x = x;
      bag.projected[i].y = y;
    }
    if (parked) return;
    for (let i = 0; i < 4; i++) {
      bag.quad[i * 2] = bag.projected[i].x;
      bag.quad[i * 2 + 1] = bag.projected[i].y;
    }

    const source = bag.source;
    source[0].x = 0;
    source[0].y = 0;
    source[1].x = cssWidth;
    source[1].y = 0;
    source[2].x = cssWidth;
    source[2].y = cssHeight;
    source[3].x = 0;
    source[3].y = cssHeight;
    const h = homography(source, bag.projected);
    const transform = h ? cssMatrix3d(h) : "none";
    if (transform !== bag.lastTransform) {
      el.style.transform = transform;
      bag.lastTransform = transform;
    }
  });

  return null;
}

function Model({
  kind,
  src,
  title,
  interactive,
  onMounted,
}: {
  kind: DeviceKind;
  src: string;
  title: string;
  interactive: boolean;
  onMounted: (update: (value: number) => number) => void;
}) {
  const spec = devices[kind];
  const rigRef = useRef<Group>(null);
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const gl = useThree((state) => state.gl);
  const gltf = useGLTF(spec.model, spec.draco ? DRACO : false);
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    if (kind === "macbook") sealKeyboardDeck(cloned);
    return cloned;
  }, [gltf.scene, kind]);
  const screen = useMemo(() => {
    const matches: Mesh[] = [];
    scene.traverse((object) => {
      if (object.name === spec.screen && (object as Mesh).isMesh) {
        matches.push(object as Mesh);
      }
    });
    return matches[0] ?? null;
  }, [scene, spec.screen]);

  useLayoutEffect(() => {
    onMounted((value) => value + 1);
  }, [onMounted, scene]);

  useLayoutEffect(() => {
    tuneTextures(scene, gl.capabilities.getMaxAnisotropy());
  }, [gl, scene]);

  useLayoutEffect(() => {
    const pose = interactiveRef.current ? spec.front : spec.rotation;
    rigRef.current?.rotation.set(pose[0], pose[1], pose[2]);
  }, [spec]);

  return (
    <group name="device-rig" ref={rigRef}>
      <primitive object={scene} />
      {screen ? (
        <ProjectedScreen
          mesh={screen}
          src={src}
          title={title}
          right={spec.right}
          up={spec.up}
          out={spec.out}
          cssWidth={spec.cssWidth}
          radius={spec.radius}
          interactive={interactive}
        />
      ) : null}
    </group>
  );
}

/** Frame the device on the fitted angle before the first paint, with no camera move. */
function PlaceCamera({
  token,
  straight,
  onPlaced,
}: {
  token: string;
  straight: boolean;
  onPlaced: (ready: boolean) => void;
}) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const scene = useThree((state) => state.scene);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const seen = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (straight || !controls || !("isPerspectiveCamera" in camera)) return;
    const rig = scene.getObjectByName("device-rig");
    if (!rig) return;
    const perspective = camera as PerspectiveCamera;
    rig.updateWorldMatrix(true, true);
    const box = new Box3().setFromObject(rig);
    if (box.isEmpty()) return;
    const center = box.getCenter(new Vector3());
    const boxSize = box.getSize(new Vector3());
    const maxSize = Math.max(boxSize.x, boxSize.y, boxSize.z);
    const fitHeight = maxSize / (2 * Math.atan((Math.PI * perspective.fov) / 360));
    const fitWidth = fitHeight / Math.max(perspective.aspect, 0.01);
    const distance = 1.08 * Math.max(fitHeight, fitWidth);
    const fresh = seen.current !== token;
    const direction = fresh ? new Vector3(0, 0.4, 5) : perspective.position.clone().sub(center);
    if (direction.lengthSq() < 1e-6) direction.set(0, 0.2, 1);
    direction.normalize();
    perspective.position.copy(center).addScaledVector(direction, distance);
    perspective.near = distance / 100;
    perspective.far = distance * 100;
    perspective.lookAt(center);
    perspective.updateProjectionMatrix();
    controls.target.copy(center);
    controls.update();
    seen.current = token;
    onPlaced(true);
    invalidate();
  }, [camera, controls, invalidate, onPlaced, scene, size.height, size.width, straight, token]);

  return null;
}

function CameraTune({ fov }: { fov: number }) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    if (!("fov" in camera)) return;
    const perspective = camera as PerspectiveCamera;
    if (perspective.fov === fov) return;
    perspective.fov = fov;
    perspective.updateProjectionMatrix();
    invalidate();
  }, [camera, fov, invalidate]);
  return null;
}

const fitCenter = new Vector3();
const fitSizeVec = new Vector3();
const fitBox = new Box3();
const frontDir = new Vector3(0, 0.04, 1).normalize();
const angleDir = new Vector3(0, 0.4, 5).normalize();

function fitCamera(
  camera: PerspectiveCamera,
  controls: OrbitControlsImpl,
  rig: Object3D,
  direction: Vector3,
) {
  rig.updateWorldMatrix(true, true);
  const box = fitBox.setFromObject(rig);
  if (box.isEmpty()) return;
  const center = box.getCenter(fitCenter);
  const boxSize = box.getSize(fitSizeVec);
  const maxSize = Math.max(boxSize.x, boxSize.y, boxSize.z);
  const fitHeight = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
  const fitWidth = fitHeight / Math.max(camera.aspect, 0.01);
  const distance = 1.04 * Math.max(fitHeight, fitWidth);
  camera.position.copy(center).addScaledVector(direction, distance);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

/** Turns the device square to the camera when it is expanded, then keeps a short orbit around that view. */
function StagePose({ kind, straight }: { kind: DeviceKind; straight: boolean }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const scene = useThree((state) => state.scene);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const rest = useRef<{ azimuth: number; polar: number } | null>(null);
  const sized = useRef({ w: 0, h: 0 });
  const reduce = useRef(false);
  const aim = useRef(new Vector3().copy(angleDir));

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useLayoutEffect(() => {
    rest.current = null;
  }, [kind, straight]);

  useFrame((_, delta) => {
    const rig = scene.getObjectByName("device-rig");
    if (!rig || !controls) return;
    if (sized.current.w !== size.width || sized.current.h !== size.height) {
      sized.current = { w: size.width, h: size.height };
      rest.current = null;
    }
    const spec = devices[kind];
    const target = straight ? spec.front : spec.rotation;
    const step = reduce.current ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 8);
    let spinning = false;
    const axes = ["x", "y", "z"] as const;
    for (let i = 0; i < 3; i++) {
      const deltaAng = Math.atan2(
        Math.sin(target[i] - rig.rotation[axes[i]]),
        Math.cos(target[i] - rig.rotation[axes[i]]),
      );
      if (Math.abs(deltaAng) > 0.001) {
        rig.rotation[axes[i]] += deltaAng * step;
        spinning = true;
      } else {
        rig.rotation[axes[i]] = target[i];
      }
    }
    const goal = straight ? frontDir : angleDir;
    if (spinning || !rest.current) {
      aim.current.lerp(goal, step);
      if (aim.current.lengthSq() > 1e-8) aim.current.normalize();
      fitCamera(camera, controls, rig, aim.current);
      if (!spinning) {
        rest.current = {
          azimuth: controls.getAzimuthalAngle(),
          polar: controls.getPolarAngle(),
        };
      }
      invalidate();
      return;
    }
    if (!straight) return;
    const pose = rest.current;
    const yaw = 0.2;
    const pitch = 0.1;
    const azimuth = controls.getAzimuthalAngle();
    const polar = controls.getPolarAngle();
    const minAzimuth = pose.azimuth - yaw;
    const maxAzimuth = pose.azimuth + yaw;
    const minPolar = Math.max(0.2, pose.polar - pitch);
    const maxPolar = Math.min(Math.PI - 0.2, pose.polar + pitch);
    const nextAzimuth = azimuth < minAzimuth ? minAzimuth : azimuth > maxAzimuth ? maxAzimuth : azimuth;
    const nextPolar = polar < minPolar ? minPolar : polar > maxPolar ? maxPolar : polar;
    if (nextAzimuth === azimuth && nextPolar === polar) return;
    if (nextAzimuth !== azimuth) controls.setAzimuthalAngle(nextAzimuth);
    if (nextPolar !== polar) controls.setPolarAngle(nextPolar);
    invalidate();
  });

  return null;
}

/** Demand mode renders nothing until something asks. Give the screen a few frames to map. */
function Settle({ token, active }: { token: string; active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (!active) return;
    let frames = 0;
    let id = 0;
    const step = () => {
      invalidate();
      frames += 1;
      if (frames < 4) id = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(id);
  }, [active, invalidate, token]);
  return null;
}

function PointerGate({ interactive }: { interactive: boolean }) {
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    gl.domElement.style.pointerEvents = interactive ? "auto" : "none";
  }, [gl, interactive]);
  return null;
}

export function DeviceStage({
  kind,
  src,
  title,
  interactive = false,
}: {
  kind: DeviceKind;
  src: string;
  title: string;
  interactive?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [generation, setGeneration] = useState(0);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(true);
  const [shown, setShown] = useState(kind);
  const [veil, setVeil] = useState(false);
  const frame = `${shown}:${generation}`;

  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting),
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (kind === shown) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(kind);
      return;
    }
    setVeil(true);
    const wait = window.setTimeout(() => setShown(kind), 220);
    return () => window.clearTimeout(wait);
  }, [kind, shown]);

  useEffect(() => {
    if (!veil || kind !== shown) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setVeil(false));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [veil, kind, shown]);

  return (
    <div ref={holder} className={`relative h-full w-full isolate ${interactive ? "" : "pointer-events-none"}`}>
    {ready ? null : (
      <div className="stage-wait">
        <CoreSpiral />
      </div>
    )}
    <Canvas
      className={`stage-fade h-full w-full ${ready && !veil ? "opacity-100" : "opacity-0"} ${interactive ? "" : "pointer-events-none"}`}
      frameloop={live ? "demand" : "never"}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: shown === "iphone" ? 28 : 32, position: [0, 0.4, 5] }}
    >
      <PointerGate interactive={interactive} />
      <CameraTune fov={shown === "iphone" ? 28 : 32} />
      <Settle token={`${shown}:${src}:${interactive}`} active={live || interactive} />
      <Model key={shown} kind={shown} src={src} title={title} interactive={interactive} onMounted={setGeneration} />
      <PlaceCamera token={frame} straight={interactive} onPlaced={setReady} />
      <StagePose kind={shown} straight={interactive} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 4]} intensity={2.6} />
      <directionalLight position={[-3, 2, 1]} intensity={0.55} />
      <OrbitControls
        makeDefault
        enabled={interactive}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.16}
        rotateSpeed={0.7}
      />
    </Canvas>
    </div>
  );
}

useGLTF.preload(devices.macbook.model);
useGLTF.preload(devices.iphone.model, DRACO);
