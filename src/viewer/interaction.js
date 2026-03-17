/**
 * interaction.js
 * Rally Supreme — Mouse Interaction (Raycast, Hover, Click)
 *
 * Hover: scales sprite up 5% for feedback
 * Click: fires InfoPanel.show(part)
 * Click on empty: fires InfoPanel.hide()
 *
 * Note: OrbitControls handles pan/zoom — we only intercept
 * hover and click here, not drag.
 */

import * as THREE from 'three';

export function setupInteraction(renderer, camera, spriteGroup, partsByLabel, infoPanel) {
  const raycaster = new THREE.Raycaster();
  const pointer   = new THREE.Vector2();
  let   hovered   = null;
  let   selected  = null;

  // ── Raycast helper ────────────────────────────────────────────────────────
  function getHit(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    pointer.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(spriteGroup.children);
    // Filter out fallback-only sprites from hover (they have no real part)
    return hits.find(h => !h.object.userData.isFallback) || hits[0] || null;
  }

  // ── Hover ─────────────────────────────────────────────────────────────────
  function applyHover(sprite) {
    if (!sprite || sprite === selected) return;
    sprite.scale.copy(sprite.userData.baseScale).multiplyScalar(1.06);
  }

  function clearHover(sprite) {
    if (!sprite || sprite === selected) return;
    sprite.scale.copy(sprite.userData.baseScale);
  }

  renderer.domElement.addEventListener('mousemove', e => {
    const hit = getHit(e);
    const target = hit?.object ?? null;

    if (target !== hovered) {
      clearHover(hovered);
      hovered = target;
      applyHover(hovered);
    }

    renderer.domElement.style.cursor = target ? 'pointer' : 'default';
  });

  renderer.domElement.addEventListener('mouseleave', () => {
    clearHover(hovered);
    hovered = null;
    renderer.domElement.style.cursor = 'default';
  });

  // ── Click ─────────────────────────────────────────────────────────────────
  // Track mousedown position to distinguish clicks from drags
  let mouseDownPos = null;

  renderer.domElement.addEventListener('mousedown', e => {
    mouseDownPos = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener('mouseup', e => {
    if (!mouseDownPos) return;
    const dx = Math.abs(e.clientX - mouseDownPos.x);
    const dy = Math.abs(e.clientY - mouseDownPos.y);
    mouseDownPos = null;

    // Only treat as a click if mouse barely moved (not a pan drag)
    if (dx > 4 || dy > 4) return;

    const hit = getHit(e);

    // Deselect previous
    if (selected) {
      selected.scale.copy(selected.userData.baseScale);
      selected = null;
    }

    if (!hit) {
      infoPanel.hide();
      return;
    }

    const sprite = hit.object;
    const label  = sprite.userData.label;
    const part   = partsByLabel.get(label);

    if (part) {
      // Apply selected scale
      selected = sprite;
      sprite.scale.copy(sprite.userData.baseScale).multiplyScalar(1.08);
      infoPanel.show(part);
    }
  });
}
