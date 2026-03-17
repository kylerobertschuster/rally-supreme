/**
 * main.js
 * Rally Supreme — Vite Entry Point
 *
 * Reads ?slug= from the URL so any assembly can be loaded without
 * rebuilding. Defaults to honda-xr650l-1997-transmission for dev.
 *
 * Usage:
 *   http://localhost:5173/              → loads default slug
 *   http://localhost:5173/?slug=ktm-500-exc-f-2025-engine  → loads that assembly
 */

import './styles/app.css';
import { RallyViewer } from './viewer/RallyViewer';

const DEFAULT_SLUG = 'honda-xr650l-1997-transmission';

async function init() {
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug') || DEFAULT_SLUG;

  // Show loading state in title
  document.title = `Loading — Rally Supreme`;

  const viewer = new RallyViewer();

  await viewer.load(slug);
  viewer.initScene();
  viewer.start();

  // Update title with assembly info
  if (viewer.assembly) {
    const a = viewer.assembly;
    document.title = `${a.brand} ${a.model} ${a.year} · ${a.assembly} — Rally Supreme`;
  }
}

init().catch(err => {
  console.error('[main] Fatal init error:', err);
  document.body.innerHTML = `
    <div style="
      font-family: 'DM Mono', monospace;
      color: #e85c2e;
      padding: 40px;
      background: #0d0d0d;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    ">
      <div style="font-size:11px;letter-spacing:.1em;color:#555;margin-bottom:12px">RALLY SUPREME — FATAL ERROR</div>
      <div style="font-size:18px;margin-bottom:8px">${err.message}</div>
      <div style="font-size:11px;color:#555;margin-top:16px">Check the console for details.</div>
    </div>
  `;
});
