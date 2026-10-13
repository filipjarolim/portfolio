"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { Camera, Mesh, Object3D, PerspectiveCamera } from "three";
import { BoxGeometry, Mesh as SolidMesh, MeshStandardMaterial, Vector3 } from "three";
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
    cssWidth: 1440,
    radius: "2.2%",
    rotation: [0.42, 0.55, 0] as [number, number, number],
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
  },
} as const;

type Axis = readonly [number, number, number];
type Point = { x: number; y: number };

/**
 * Homography from four source pixels to four destination pixels.
 * Returns the eight coefficients with h22 fixed at 1, or null if the
 * quad is degenerate.
 */
function homography(src: Point[], dst: Point[]): number[] | null {
  const matrix: number[][] = [];
  const rhs: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    rhs.push(u);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    rhs.push(v);
  }

  const rows = matrix.map((row, index) => [...row, rhs[index]]);
  const size = 8;
  for (let col = 0; col < size; col++) {
    let pivot = col;
    for (let row = col + 1; row < size; row++) {
      if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col])) pivot = row;
    }
    if (Math.abs(rows[pivot][col]) < 1e-10) return null;
    if (pivot !== col) {
      const swap = rows[col];
      rows[col] = rows[pivot];
      rows[pivot] = swap;
    }
    const scale = rows[col][col];
    for (let colIndex = col; colIndex <= size; colIndex++) rows[col][colIndex] /= scale;
    for (let row = 0; row < size; row++) {
      if (row === col) continue;
      const factor = rows[row][col];
      if (factor === 0) continue;
      for (let colIndex = col; colIndex <= size; colIndex++) {
        rows[row][colIndex] -= factor * rows[col][colIndex];
      }
    }
  }
  return rows.map((row) => row[size]);
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

function cssMatrix3d(h: number[]) {
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
}: {
  mesh: Mesh;
  src: string;
  title: string;
  right: Axis;
  up: Axis;
  out: Axis;
  cssWidth: number;
  radius: string;
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
    el.style.pointerEvents = "auto";
    el.style.borderRadius = radius;
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
    iframe.addEventListener("load", () => sealScreen(iframe));
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
    if (iframe.getAttribute("src") !== src) iframe.src = src;
  }, [src, title]);

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
}: {
  kind: DeviceKind;
  src: string;
  title: string;
}) {
  const spec = devices[kind];
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

  return (
    <Bounds fit clip observe margin={1.25}>
      <group name="device-rig" rotation={spec.rotation}>
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
          />
        ) : null}
      </group>
    </Bounds>
  );
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

/** After Bounds frames the device, allow only a short tilt around that view. */
function LimitedOrbit({ token }: { token: string }) {
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!controls) return;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;

    let frames = 0;
    let id = 0;
    const step = () => {
      invalidate();
      frames += 1;
      if (frames < 20) {
        id = requestAnimationFrame(step);
        return;
      }
      const yaw = 0.2;
      const pitch = 0.1;
      const azimuth = controls.getAzimuthalAngle();
      const polar = controls.getPolarAngle();
      controls.minAzimuthAngle = azimuth - yaw;
      controls.maxAzimuthAngle = azimuth + yaw;
      controls.minPolarAngle = Math.max(0.2, polar - pitch);
      controls.maxPolarAngle = Math.min(Math.PI - 0.2, polar + pitch);
      invalidate();
    };
    step();
    return () => cancelAnimationFrame(id);
  }, [controls, invalidate, token]);

  return null;
}

/** Demand mode renders nothing until something asks. Give Bounds and the screen a few frames. */
function Settle({ token }: { token: string }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    let frames = 0;
    let id = 0;
    const step = () => {
      invalidate();
      frames += 1;
      if (frames < 24) id = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(id);
  }, [invalidate, token]);
  return null;
}

export function DeviceStage({
  kind,
  src,
  title,
}: {
  kind: DeviceKind;
  src: string;
  title: string;
}) {
  return (
    <Canvas
      className="h-full w-full"
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: kind === "iphone" ? 28 : 32, position: [0, 0.4, 5] }}
    >
      <CameraTune fov={kind === "iphone" ? 28 : 32} />
      <Settle token={`${kind}:${src}`} />
      <LimitedOrbit token={kind} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 4]} intensity={2.6} />
      <directionalLight position={[-3, 2, 1]} intensity={0.55} />
      <Model kind={kind} src={src} title={title} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.4}
      />
    </Canvas>
  );
}

useGLTF.preload(devices.macbook.model);
useGLTF.preload(devices.iphone.model, DRACO);
