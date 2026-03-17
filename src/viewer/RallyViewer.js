/**
 * RallyViewer.js
 * Rally Supreme — Main Viewer Controller
 *
 * Changes from previous version:
 *  - Explode is now a continuous slider (0–1), not a binary toggle
 *  - Background diagram layer is togglable at runtime
 *  - Missing assets are collected and surfaced in the UI
 *  - Explode factor drives lerp targets every frame (smooth at any speed)
 *  - ControlsUI rebuilt to match — see Controls.js
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadAssemblyData, loadTextures, createWorldMapper } from './loaders';
import { setupScene } from './scene';
import { setupInteraction } from './interaction';
import { InfoPanel } from '../ui/InfoPanel';
import { ControlsUI } from '../ui/Controls';

export class RallyViewer {
  constructor() {
    this.scene        = null;
    this.camera       = null;
    this.renderer     = null;
    this.controls     = null;
    this.spriteGroup  = new THREE.Group();
    this.bgSprite     = null;          // background diagram sprite

    this.partsByLabel      = new Map();
    this.placementsByLabel = new Map();
    this.assembly          = null;
    this.worldMapper       = null;

    // Explode state — continuous, not binary
    this.explodeFactor     = 0;        // current animated value 0–1
    this.explodeTarget     = 0;        // what we're lerping toward
    this.explodeDistance   = 2.0;      // scalar from assembly.json

    // Per-sprite position tracking
    this.originalPositions = new Map(); // uuid → THREE.Vector3
    this.targetPositions   = new Map(); // uuid → THREE.Vector3

    // Missing asset tracking
    this.missingAssets     = [];       // array of { label, segment_image }

    this.infoPanel    = new InfoPanel();
    this.controlsUI   = null;

    this.showBgDiagram = true;
  }

  // ── LOAD ────────────────────────────────────────────────────────────────────
  async load(slug) {
    try {
      const basePath = `/data/${slug}`;
      const { assembly, parts, placements } = await loadAssemblyData(basePath);

      this.assembly      = assembly;
      this.worldMapper   = createWorldMapper(assembly);
      this.explodeDistance = assembly.viewer_defaults?.explode_distance ?? 2.0;
      this.showBgDiagram = assembly.viewer_defaults?.show_background_diagram ?? true;

      this.partsByLabel.clear();
      this.placementsByLabel.clear();
      this.missingAssets = [];

      parts.forEach(p => this.partsByLabel.set(p.label, p));
      placements.forEach(p => this.placementsByLabel.set(p.label, p));

      // loadTextures now returns { sprites, missing }
      const { sprites, missing } = await loadTextures(basePath, placements, this.worldMapper);

      this.missingAssets = missing;

      sprites.forEach(sprite => {
        this.spriteGroup.add(sprite);
        const pos = sprite.position.clone();
        this.originalPositions.set(sprite.uuid, pos);
        this.targetPositions.set(sprite.uuid, pos.clone());
      });

      if (missing.length > 0) {
        console.warn(`[RallyViewer] ${missing.length} missing segment image(s):`,
          missing.map(m => m.segment_image).join(', '));
      }

    } catch (err) {
      console.error('[RallyViewer] Load failed:', err);
      this.infoPanel.showError(`LOAD FAILED: ${err.message}`);
    }
  }

  // ── INIT SCENE ──────────────────────────────────────────────────────────────
  initScene() {
    const { scene, camera, renderer } = setupScene(this.assembly, this.worldMapper);
    this.scene    = scene;
    this.camera   = camera;
    this.renderer = renderer;

    this.scene.add(this.spriteGroup);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.enableZoom   = true;
    this.controls.enablePan    = true;
    this.controls.target.set(0, 0, 0);

    setupInteraction(
      this.renderer,
      this.camera,
      this.spriteGroup,
      this.partsByLabel,
      this.infoPanel
    );

    // Build UI — passes this viewer so Controls can call setExplode / toggleBg
    this.controlsUI = new ControlsUI(this);

    // Background diagram
    if (this.showBgDiagram) {
      this._addBackgroundDiagram();
    }

    // Report missing assets into UI
    if (this.missingAssets.length > 0) {
      this.controlsUI.showMissingAssets(this.missingAssets);
    }

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  // ── BACKGROUND DIAGRAM ──────────────────────────────────────────────────────
  async _addBackgroundDiagram() {
    const basePath    = `/data/${this.assembly.slug}`;
    const diagramPath = `${basePath}/${this.assembly.diagram_image}`;

    try {
      const texture = await new THREE.TextureLoader().loadAsync(diagramPath);
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.SpriteMaterial({
        map:         texture,
        transparent: true,
        opacity:     0.18,
        depthTest:   false,
        depthWrite:  false,
      });

      const sprite  = new THREE.Sprite(material);
      sprite.renderOrder = -1;

      const aspect      = texture.image.width / texture.image.height;
      const worldAspect = this.worldMapper.worldWidth / this.worldMapper.worldHeight;
      let scaleX, scaleY;
      if (aspect > worldAspect) {
        scaleY = this.worldMapper.worldHeight;
        scaleX = scaleY * aspect;
      } else {
        scaleX = this.worldMapper.worldWidth;
        scaleY = scaleX / aspect;
      }

      sprite.scale.set(scaleX, scaleY, 1);
      sprite.position.set(0, 0, -this.worldMapper.worldDepth * 0.5);

      this.bgSprite = sprite;
      this.scene.add(sprite);

    } catch (err) {
      console.warn('[RallyViewer] Background diagram failed to load:', err.message);
    }
  }

  // ── EXPLODE (continuous, 0–1) ────────────────────────────────────────────────
  /**
   * Set explode factor. Called by the slider in ControlsUI.
   * @param {number} factor  0.0 = assembled, 1.0 = fully exploded
   */
  setExplode(factor) {
    this.explodeTarget = Math.max(0, Math.min(1, factor));
    this._updateTargetPositions();
  }

  _updateTargetPositions() {
    this.spriteGroup.children.forEach(sprite => {
      const orig      = this.originalPositions.get(sprite.uuid);
      const placement = this.placementsByLabel.get(sprite.userData.label);
      if (!orig || !placement) return;

      const ev = sprite.userData.explodeVec; // THREE.Vector3, Y already flipped
      if (!ev) return;

      const target = orig.clone().addScaledVector(ev, this.explodeTarget * this.explodeDistance);
      this.targetPositions.set(sprite.uuid, target);
    });
  }

  // ── BACKGROUND TOGGLE ────────────────────────────────────────────────────────
  toggleBackground() {
    if (!this.bgSprite) {
      // Not loaded yet — load it now
      this.showBgDiagram = true;
      this._addBackgroundDiagram();
      return;
    }
    this.bgSprite.visible = !this.bgSprite.visible;
    this.showBgDiagram    = this.bgSprite.visible;
  }

  setBackgroundOpacity(opacity) {
    if (this.bgSprite?.material) {
      this.bgSprite.material.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  // ── RESIZE ──────────────────────────────────────────────────────────────────
  handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left   = -this.worldMapper.worldWidth / 2 * aspect;
    this.camera.right  =  this.worldMapper.worldWidth / 2 * aspect;
    this.camera.top    =  this.worldMapper.worldHeight / 2;
    this.camera.bottom = -this.worldMapper.worldHeight / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── RENDER LOOP ──────────────────────────────────────────────────────────────
  start() {
    const LERP_SPEED = 0.1;

    const animate = () => {
      requestAnimationFrame(animate);

      // Smooth explode interpolation
      const prevFactor = this.explodeFactor;
      this.explodeFactor += (this.explodeTarget - this.explodeFactor) * LERP_SPEED;

      // Only lerp sprite positions if factor is actively changing
      if (Math.abs(this.explodeFactor - prevFactor) > 0.0001) {
        this.spriteGroup.children.forEach(sprite => {
          const target = this.targetPositions.get(sprite.uuid);
          if (target) sprite.position.lerp(target, LERP_SPEED);
        });
      }

      this.controls?.update();
      this.renderer?.render(this.scene, this.camera);
    };

    animate();
  }
}
