/**
 * scene.js
 * Rally Supreme — Three.js Scene Bootstrap
 *
 * Orthographic camera — correct for technical diagrams.
 * Perspective would distort part proportions at the edges.
 *
 * The renderer is appended to document.body.
 * CSS takes care of full-bleed via app.css.
 */

import * as THREE from 'three';

export function setupScene(assembly, mapper) {
  // ── Scene ─────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0d0d);

  // Subtle atmospheric fog — makes deep Z layers recede naturally
  scene.fog = new THREE.Fog(0x0d0d0d, 30, 60);

  // ── Orthographic camera ───────────────────────────────────────────────────
  // Width is derived from world height × screen aspect ratio.
  // This way the diagram fills the screen regardless of window shape.
  const aspect     = window.innerWidth / window.innerHeight;
  const halfH      = mapper.worldHeight / 2;
  const halfW      = halfH * aspect;

  const camera = new THREE.OrthographicCamera(
    -halfW,  // left
     halfW,  // right
     halfH,  // top
    -halfH,  // bottom
    0.1,     // near
    1000     // far
  );
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  // ── Renderer ─────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.sortObjects = true;   // respect renderOrder for depth layering

  document.body.appendChild(renderer.domElement);
  renderer.domElement.id = 'rs-canvas';

  // ── Minimal lighting (sprites are unlit but background plane uses it) ────
  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);

  return { scene, camera, renderer };
}
