/**
 * loaders.js
 * Rally Supreme — Viewer Data Loader
 *
 * Contract: see PIPELINE.md
 * This file is the viewer's side of that contract.
 * It reads assembly.json, parts.json, placements.json exactly as specified.
 *
 * RULES this file enforces:
 *  - Y axis is flipped (diagram top-left → Three.js center-up)
 *  - explode_vector[1] is negated (PIPELINE.md Section 6)
 *  - segment_image is used verbatim — this file constructs no paths itself
 *  - Missing segment images produce a fallback placeholder sprite, not a silent gap
 *  - Canvas dimensions come from assembly.json canvas.width/height
 */

import * as THREE from 'three';

// ── CONSTANTS (must match PIPELINE.md) ───────────────────────────────────────
const FALLBACK_SPRITE_COLOR = '#e85c2e';
const FALLBACK_SPRITE_SIZE  = 1.0;

// ── LOAD ASSEMBLY DATA ────────────────────────────────────────────────────────
/**
 * Load all three JSON files for an assembly.
 * Throws if any file is missing or malformed.
 */
export async function loadAssemblyData(basePath) {
  const [assembly, parts, placements] = await Promise.all([
    fetchJson(`${basePath}/assembly.json`),
    fetchJson(`${basePath}/parts.json`),
    fetchJson(`${basePath}/placements.json`),
  ]);

  // Validate required top-level fields
  assertField(assembly, 'slug',         'assembly.json');
  assertField(assembly, 'canvas',       'assembly.json');
  assertField(assembly, 'canvas.width', 'assembly.json', assembly.canvas?.width);
  assertField(assembly, 'canvas.height','assembly.json', assembly.canvas?.height);

  return { assembly, parts, placements };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  return res.json();
}

function assertField(obj, path, file, value) {
  const v = value !== undefined ? value : obj[path];
  if (v === undefined || v === null) {
    throw new Error(`${file}: missing required field '${path}'`);
  }
}

// ── WORLD MAPPER ──────────────────────────────────────────────────────────────
/**
 * Creates the coordinate conversion functions.
 * All math matches PIPELINE.md Section 6.
 */
export function createWorldMapper(assembly) {
  const canvasWidth  = assembly.canvas.width;
  const canvasHeight = assembly.canvas.height;
  const worldHeight  = assembly.viewer_defaults?.world_height ?? 10;
  const worldWidth   = worldHeight * (canvasWidth / canvasHeight);
  const worldDepth   = assembly.viewer_defaults?.world_depth ?? 5;

  return {
    canvasWidth,
    canvasHeight,
    worldWidth,
    worldHeight,
    worldDepth,

    /**
     * Convert normalized diagram coords to Three.js world coords.
     * @param {number} x  normalized 0–1, left→right
     * @param {number} y  normalized 0–1, top→bottom  (Y is FLIPPED here)
     * @param {number} z  normalized 0–1, back→front
     */
    toWorld(x, y, z = 0) {
      return new THREE.Vector3(
        (x - 0.5) * worldWidth,
        (0.5 - y) * worldHeight,   // ← Y flip (PIPELINE.md §6)
        z * worldDepth
      );
    },
  };
}

// ── LOAD TEXTURES → SPRITES ───────────────────────────────────────────────────
/**
 * For each placement in placements.json:
 *   1. Load segment_image as texture
 *   2. Create a Three.Sprite at the correct world position
 *   3. Size it from bbox.w / bbox.h in world units
 *   4. Set renderOrder from depth_order
 *   5. Store label, explode_vector (Y-flipped), baseScale on userData
 *
 * If a texture fails to load, a fallback colored placeholder is created
 * so the assembly renders with visible gaps instead of silent ones.
 */
export async function loadTextures(basePath, placements, mapper) {
  const loader  = new THREE.TextureLoader();
  const sprites = [];
  const missing = []; // { label, segment_image } — returned to viewer for UI

  for (const placement of placements) {
    // ── Validate placement fields ──────────────────────────────────────────
    if (!placement.label) {
      console.warn('[loaders] placement missing label, skipping:', placement);
      continue;
    }
    if (!placement.segment_image) {
      console.warn(`[loaders] label ${placement.label}: no segment_image, using fallback`);
      missing.push({ label: placement.label, segment_image: '(not set)' });
    }
    if (!placement.bbox) {
      console.warn(`[loaders] label ${placement.label}: no bbox, using default size`);
    }

    // ── World position ─────────────────────────────────────────────────────
    const worldPos = mapper.toWorld(
      placement.x   ?? 0.5,
      placement.y   ?? 0.5,
      placement.z   ?? 0,
    );

    // ── Explode vector (Y-flipped per PIPELINE.md §6) ─────────────────────
    const ev = placement.explode_vector ?? [0, 0, 0];
    const explodeVec = new THREE.Vector3(
      ev[0],
      -ev[1],   // ← Y flip (PIPELINE.md §6)
      ev[2] ?? 0,
    );

    // ── Sprite size from bbox ──────────────────────────────────────────────
    const bboxWorldW = placement.bbox
      ? placement.bbox.w * mapper.worldWidth
      : FALLBACK_SPRITE_SIZE;
    const bboxWorldH = placement.bbox
      ? placement.bbox.h * mapper.worldHeight
      : FALLBACK_SPRITE_SIZE;

    // ── Load texture or use fallback ───────────────────────────────────────
    let sprite;

    if (placement.segment_image) {
      try {
        const texture = await loader.loadAsync(`${basePath}/${placement.segment_image}`);
        texture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthTest:  true,
          depthWrite: false,
          alphaTest:  0.01,  // discard near-fully-transparent pixels
        });

        sprite = new THREE.Sprite(material);

        // Size: use bbox world dimensions (maintains diagram proportion)
        sprite.scale.set(bboxWorldW, bboxWorldH, 1);

      } catch (err) {
        console.warn(`[loaders] label ${placement.label}: texture load failed — using fallback. ${err.message}`);
        missing.push({ label: placement.label, segment_image: placement.segment_image });
        sprite = makeFallbackSprite(placement.label, bboxWorldW, bboxWorldH);
      }
    } else {
      sprite = makeFallbackSprite(placement.label, bboxWorldW, bboxWorldH);
    }

    // ── Anchor offset ──────────────────────────────────────────────────────
    // Anchor shifts the sprite so its anchor point sits at worldPos.
    // Default anchor is {x:0.5, y:0.5} = center.
    const anchorX = placement.anchor?.x ?? 0.5;
    const anchorY = placement.anchor?.y ?? 0.5;
    sprite.position.copy(worldPos);
    sprite.position.x -= sprite.scale.x * (anchorX - 0.5);
    sprite.position.y += sprite.scale.y * (anchorY - 0.5);  // Y is up in Three.js

    // ── userData — everything the viewer needs at runtime ──────────────────
    sprite.userData = {
      label:        placement.label,
      explodeVec,                              // THREE.Vector3, Y already flipped
      basePosition: sprite.position.clone(),   // for reset
      baseScale:    sprite.scale.clone(),      // for hover
      depthOrder:   placement.depth_order ?? 0,
      isFallback:   !placement.segment_image,
    };

    sprite.renderOrder = placement.depth_order ?? 0;

    sprites.push(sprite);
  }

  return { sprites, missing };
}

// ── FALLBACK SPRITE ───────────────────────────────────────────────────────────
/**
 * Creates a labeled orange placeholder sprite.
 * Visible in the scene so authors can see exactly which parts are missing.
 */
function makeFallbackSprite(label, width, height) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = 'rgba(232,92,46,0.15)';
  ctx.fillRect(0, 0, size, size);

  // Border
  ctx.strokeStyle = '#e85c2e';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(2, 2, size - 4, size - 4);

  // Label
  ctx.fillStyle = '#e85c2e';
  ctx.font = `bold ${label.length > 2 ? 32 : 44}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, size / 2, size / 2);

  // "MISSING" text
  ctx.fillStyle = 'rgba(232,92,46,0.6)';
  ctx.font = '12px monospace';
  ctx.fillText('NO IMAGE', size / 2, size - 16);

  const texture  = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest:  false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(
    width  || FALLBACK_SPRITE_SIZE,
    height || FALLBACK_SPRITE_SIZE,
    1
  );
  return sprite;
}
