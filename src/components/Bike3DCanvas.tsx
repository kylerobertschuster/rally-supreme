"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Part } from "@/lib/types";
import {
  Box3,
  Color,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader";

type PartKey =
  | "front"
  | "rear"
  | "handlebar"
  | "engine"
  | "exhaust"
  | "tank"
  | "frame"
  | "seat"
  | "signals"
  | "radiator";

const partRules: Array<{ key: PartKey; keywords: string[] }> = [
  { key: "exhaust", keywords: ["exhaust", "header", "pipe", "muffler"] },
  {
    key: "handlebar",
    keywords: [
      "handlebar",
      "bar",
      "grip",
      "lever",
      "switch",
      "damper",
      "steering",
      "mirror",
    ],
  },
  {
    key: "front",
    keywords: ["front", "fork", "caliper", "disc", "axle", "tow", "lug"],
  },
  {
    key: "rear",
    keywords: [
      "rear",
      "sprocket",
      "chain",
      "mudguard",
      "swing",
      "disc",
      "axle",
    ],
  },
  { key: "radiator", keywords: ["radiator", "hose"] },
  { key: "tank", keywords: ["tank", "fuel", "gas", "vent", "cap"] },
  {
    key: "engine",
    keywords: ["clutch", "water pump", "oil", "ecu", "map", "filter"],
  },
  { key: "signals", keywords: ["signal", "light", "gopro", "tail"] },
  { key: "seat", keywords: ["seat"] },
  {
    key: "frame",
    keywords: ["frame", "guard", "bash", "peg", "triple clamp"],
  },
];

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

function partKeyFromName(name: string): PartKey {
  const lowered = normalize(name);
  for (const rule of partRules) {
    if (rule.keywords.some((kw) => lowered.includes(kw))) {
      return rule.key;
    }
  }
  return "frame";
}

function findMesh(obj: Object3D): Mesh | null {
  if (obj instanceof Mesh) return obj;
  let current: Object3D | null = obj;
  while (current?.parent) {
    if (current.parent instanceof Mesh) return current.parent;
    current = current.parent;
  }
  return null;
}

type MeshZone = "front" | "rear" | "center";
type MeshHeight = "top" | "mid" | "low";

function classifyMesh(
  meshCenter: Vector3,
  sceneCenter: Vector3,
  sceneSize: Vector3,
  lengthAxis: 0 | 1 | 2
): { zone: MeshZone; height: MeshHeight } {
  const axes = [meshCenter.x, meshCenter.y, meshCenter.z];
  const sceneAxes = [sceneCenter.x, sceneCenter.y, sceneCenter.z];
  const sizeAxes = [sceneSize.x, sceneSize.y, sceneSize.z];

  const relLength = axes[lengthAxis] - sceneAxes[lengthAxis];
  const lengthThreshold = sizeAxes[lengthAxis] * 0.18;

  const relHeight = meshCenter.y - sceneCenter.y;
  const heightThreshold = sceneSize.y * 0.2;

  const zone: MeshZone =
    relLength > lengthThreshold
      ? "front"
      : relLength < -lengthThreshold
        ? "rear"
        : "center";

  const height: MeshHeight =
    relHeight > heightThreshold
      ? "top"
      : relHeight < -heightThreshold
        ? "low"
        : "mid";

  return { zone, height };
}

function meshMatchesKey(mesh: Mesh, key: PartKey | null) {
  if (!key) return false;
  const zone = mesh.userData.__rally_zone as MeshZone | undefined;
  const height = mesh.userData.__rally_height as MeshHeight | undefined;
  if (!zone || !height) return false;

  switch (key) {
    case "front":
      return zone === "front";
    case "rear":
      return zone === "rear";
    case "handlebar":
      return zone === "front" && height === "top";
    case "tank":
      return zone === "center" && height === "top";
    case "seat":
      return zone === "rear" && height === "top";
    case "engine":
      return zone === "center" && height !== "top";
    case "radiator":
      return zone === "front" && height === "mid";
    case "exhaust":
      return zone === "rear" && height !== "top";
    case "signals":
      return height === "top" && (zone === "front" || zone === "rear");
    case "frame":
    default:
      return zone === "center";
  }
}

function keyFromMesh(mesh: Mesh): PartKey {
  const zone = mesh.userData.__rally_zone as MeshZone | undefined;
  const height = mesh.userData.__rally_height as MeshHeight | undefined;
  if (!zone || !height) return "frame";

  if (zone === "front" && height === "top") return "handlebar";
  if (zone === "front") return "front";
  if (zone === "rear" && height === "top") return "seat";
  if (zone === "rear") return "rear";
  if (zone === "center" && height === "top") return "tank";
  if (zone === "center" && height === "low") return "engine";
  return "frame";
}

function BikeModel({
  modelUrl,
  parts,
  selectedPartId,
  onSelectPart,
  rotationY,
  selectedMeshUuid,
  onMeshSelected,
  onMeshPartMapped,
  selectedPartMeshUuid,
}: {
  modelUrl: string;
  parts: Part[];
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
  rotationY: number;
  selectedMeshUuid: string | null;
  onMeshSelected: (meshUuid: string | null) => void;
  onMeshPartMapped: (partId: string, meshUuid: string) => void;
  selectedPartMeshUuid: string | null;
}) {
  const gltf = useLoader(GLTFLoader, modelUrl) as GLTF;

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const materials = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        materials.forEach((mat) => {
          const material = mat as MeshStandardMaterial | undefined;
          if (!material || !material.color) return;
          if (!material.userData.__rally_baseColor) {
            material.userData.__rally_baseColor = material.color.clone();
          }
        });
      }
    });
    return cloned;
  }, [gltf.scene]);

  const { scale, center, size, lengthAxis } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    box.getSize(size);
    const center = new Vector3();
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const target = 3.2;
    const axisSizes = [size.x, size.y, size.z];
    const lengthAxis = axisSizes.indexOf(Math.max(...axisSizes)) as 0 | 1 | 2;
    return { scale: target / maxDim, center, size, lengthAxis };
  }, [scene]);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        const meshBox = new Box3().setFromObject(obj);
        const meshCenter = new Vector3();
        meshBox.getCenter(meshCenter);
        const { zone, height } = classifyMesh(
          meshCenter,
          center,
          size,
          lengthAxis
        );
        obj.userData.__rally_zone = zone;
        obj.userData.__rally_height = height;
      }
    });
  }, [scene, center, size, lengthAxis]);

  const selectedKey = useMemo(() => {
    if (!selectedPartId) return null;
    const part = parts.find((p) => p.id === selectedPartId);
    return part ? partKeyFromName(part.name) : null;
  }, [parts, selectedPartId]);

  const partsByKey = useMemo(() => {
    const map: Record<PartKey, string[]> = {
      front: [],
      rear: [],
      handlebar: [],
      engine: [],
      exhaust: [],
      tank: [],
      frame: [],
      seat: [],
      signals: [],
      radiator: [],
    };
    parts.forEach((part) => {
      map[partKeyFromName(part.name)].push(part.id);
    });
    return map;
  }, [parts]);

  useEffect(() => {
    const shouldHighlightByKey = Boolean(selectedKey && !selectedMeshUuid);
    const targetMeshUuid = selectedPartMeshUuid ?? selectedMeshUuid;

    const centerWorld = new Vector3();
    scene.getWorldPosition(centerWorld);
    const explodeDistance = 0.45;

    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        const materials = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];

        if (!obj.userData.__rally_basePosition) {
          obj.userData.__rally_basePosition = obj.position.clone();
        }

        const matchesKey = meshMatchesKey(obj, selectedKey);
        const isSelected =
          (targetMeshUuid && obj.uuid === targetMeshUuid) ||
          (shouldHighlightByKey && matchesKey);

        const basePosition = obj.userData.__rally_basePosition as Vector3;
        if (isSelected) {
          const meshWorld = new Vector3();
          obj.getWorldPosition(meshWorld);
          const dirWorld = meshWorld.clone().sub(centerWorld);
          if (dirWorld.lengthSq() < 0.0001) {
            dirWorld.set(0, 1, 0);
          } else {
            dirWorld.normalize();
          }
          const offsetWorld = dirWorld.multiplyScalar(explodeDistance);
          const parent = obj.parent;
          if (parent) {
            const parentWorldQuat = new Quaternion();
            const parentWorldScale = new Vector3();
            parent.getWorldQuaternion(parentWorldQuat);
            parent.getWorldScale(parentWorldScale);
            const offsetLocal = offsetWorld
              .clone()
              .applyQuaternion(parentWorldQuat.clone().invert());
            offsetLocal.divide(parentWorldScale);
            obj.position.copy(basePosition.clone().add(offsetLocal));
          } else {
            obj.position.copy(basePosition.clone().add(offsetWorld));
          }
        } else {
          obj.position.copy(basePosition);
        }

        materials.forEach((mat) => {
          const material = mat as MeshStandardMaterial | undefined;
          if (!material || !material.color) return;
          if (!material.userData.__rally_baseColor) {
            material.userData.__rally_baseColor = material.color.clone();
          }
          if (material.emissive && !material.userData.__rally_baseEmissive) {
            material.userData.__rally_baseEmissive = material.emissive.clone();
            material.userData.__rally_baseEmissiveIntensity =
              material.emissiveIntensity ?? 0;
          }

          const base = material.userData.__rally_baseColor as Color;
          const inverse = new Color(1 - base.r, 1 - base.g, 1 - base.b);

          if (isSelected) {
            if (material.emissive) {
              material.emissive.copy(inverse);
              material.emissiveIntensity = 0.65;
              material.color.copy(base);
            } else {
              material.color.copy(inverse);
            }
          } else {
            material.color.copy(base);
            if (material.emissive) {
              const baseEmissive = material.userData.__rally_baseEmissive as Color;
              material.emissive.copy(baseEmissive ?? new Color(0, 0, 0));
              material.emissiveIntensity =
                material.userData.__rally_baseEmissiveIntensity ?? 0;
            }
          }
        });
      }
    });
  }, [scene, selectedKey, selectedMeshUuid, selectedPartMeshUuid]);

  // Conservative one-time mapping: group meshes by heuristic key and assign parts
  // to candidate meshes by index within each group. This populates an initial
  // parts->mesh association so the UI can highlight parts without manual mapping.
  useEffect(() => {
    if (!scene || parts.length === 0) return;

    const meshGroups: Record<string, Mesh[]> = {};
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        const k = keyFromMesh(obj);
        meshGroups[k] = meshGroups[k] || [];
        meshGroups[k].push(obj);
      }
    });

    const partsByKeyLocal: Record<PartKey, string[]> = {
      front: [],
      rear: [],
      handlebar: [],
      engine: [],
      exhaust: [],
      tank: [],
      frame: [],
      seat: [],
      signals: [],
      radiator: [],
    };
    parts.forEach((part) => {
      partsByKeyLocal[partKeyFromName(part.name)].push(part.id);
    });

    (Object.keys(partsByKeyLocal) as PartKey[]).forEach((k) => {
      const partIds = partsByKeyLocal[k];
      const meshes = meshGroups[k] ?? [];
      if (partIds.length === 0 || meshes.length === 0) return;
      for (let i = 0; i < partIds.length; i++) {
        const partId = partIds[i];
        const mesh = meshes[i] ?? meshes[meshes.length - 1];
        if (mesh) onMeshPartMapped(partId, mesh.uuid);
      }
    });
  }, [scene, parts, onMeshPartMapped]);

  return (
    <group rotation={[0, rotationY, 0]}>
      <group
        scale={scale}
        position={[-center.x * scale, -center.y * scale, -center.z * scale]}
        onPointerDown={(e) => {
          e.stopPropagation();
          const mesh = findMesh(e.object as Object3D);
          if (!mesh) return;
          onMeshSelected(mesh.uuid);
          const key = keyFromMesh(mesh);
          const match = partsByKey[key][0] ?? parts[0]?.id;
          if (match) {
            // map the clicked mesh to the best candidate part, but do not auto-open the Index
            onMeshPartMapped(match, mesh.uuid);
            // intentionally do not call onSelectPart here to avoid forcing the Index overlay open
          }
        }}
      >
        <primitive object={scene} />
      </group>
    </group>
  );
}



export function Bike3DCanvas({
  modelUrl,
  parts,
  selectedPartId,
  onSelectPart,
}: {
  modelUrl?: string;
  parts: Part[];
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
}) {
  const [rotationY, setRotationY] = useState(0);
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);
  const [partMeshMap, setPartMeshMap] = useState<Record<string, string>>({});
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  if (!modelUrl) {
    return (
      <div className="w-full h-[78vh] border-b border-black/10 bg-[#e6e6e6] flex items-center justify-center text-black/50">
        No 3D model configured.
      </div>
    );
  }

  return (
    <div
      className="w-full h-[78vh] border-b border-black/10 bg-[#e6e6e6]"
      onPointerDown={(e) => {
        draggingRef.current = true;
        lastXRef.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        const dx = e.clientX - lastXRef.current;
        lastXRef.current = e.clientX;
        setRotationY((r) => r + dx * 0.01);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerLeave={() => {
        draggingRef.current = false;
      }}
      style={{ touchAction: "none" }}
    >
      <Canvas
        camera={{ position: [0, 1.4, 4], fov: 45 }}
        style={{ background: "#e6e6e6" }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 6, 3]} intensity={0.9} />
        <directionalLight position={[-4, 2, -3]} intensity={0.4} />

        <BikeModel
          modelUrl={modelUrl}
          parts={parts}
          selectedPartId={selectedPartId}
          onSelectPart={onSelectPart}
          rotationY={rotationY}
          selectedMeshUuid={selectedMesh}
          selectedPartMeshUuid={
            selectedPartId ? (partMeshMap[selectedPartId] ?? null) : null
          }
          onMeshSelected={(meshUuid) => {
            setSelectedMesh(meshUuid);
          }}
          onMeshPartMapped={(partId, meshUuid) => {
            setPartMeshMap((prev) => ({ ...prev, [partId]: meshUuid }));
          }}
        />
      </Canvas>
    </div>
  );
}
