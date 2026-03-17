/**
 * Controls.js
 * Rally Supreme — Viewer UI Controls
 *
 * Builds the entire viewer chrome:
 *  - Explode slider (continuous 0–1)
 *  - Background diagram toggle + opacity slider
 *  - Missing assets warning panel
 *  - Keyboard shortcuts
 *
 * All state lives in RallyViewer. This file only reads/writes
 * viewer.setExplode(), viewer.toggleBackground(), viewer.setBackgroundOpacity().
 */

export class ControlsUI {
  constructor(viewer) {
    this.viewer = viewer;
    this._build();
    this._bindKeys();
  }

  // ── BUILD DOM ────────────────────────────────────────────────────────────────
  _build() {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --acc:    #e85c2e;
        --acc-lo: rgba(232,92,46,0.12);
        --gold:   #c8952a;
        --green:  #3eb97d;
        --red:    #d94f4f;
        --surf:   rgba(13,13,13,0.88);
        --border: rgba(255,255,255,0.08);
        --text:   #e8e4de;
        --dim:    #666;
        --mono:   'DM Mono', monospace;
        --disp:   'Bebas Neue', sans-serif;
      }

      #rs-ui * { box-sizing: border-box; margin: 0; padding: 0; }

      /* ── BOTTOM BAR ── */
      #rs-bottom {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0;
        background: var(--surf);
        border: 1px solid var(--border);
        backdrop-filter: blur(16px);
        border-radius: 6px;
        overflow: hidden;
        z-index: 50;
        box-shadow: 0 4px 32px rgba(0,0,0,0.5);
        font-family: var(--mono);
      }

      .bar-segment {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 18px;
        border-right: 1px solid var(--border);
      }
      .bar-segment:last-child { border-right: none; }

      .bar-label {
        font-size: 9px;
        letter-spacing: .12em;
        color: var(--dim);
        text-transform: uppercase;
        white-space: nowrap;
      }

      /* ── EXPLODE SLIDER ── */
      #explode-slider {
        -webkit-appearance: none;
        width: 180px;
        height: 2px;
        background: var(--border);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }
      #explode-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--acc);
        cursor: pointer;
        box-shadow: 0 0 8px rgba(232,92,46,0.6);
        transition: transform .1s;
      }
      #explode-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

      #explode-val {
        font-size: 11px;
        color: var(--acc);
        width: 30px;
        text-align: right;
      }

      /* ── BG OPACITY SLIDER ── */
      #bg-opacity-slider {
        -webkit-appearance: none;
        width: 80px;
        height: 2px;
        background: var(--border);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }
      #bg-opacity-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: var(--gold);
        cursor: pointer;
      }
      #bg-opacity-slider:disabled { opacity: .3; pointer-events: none; }

      /* ── TOGGLE BUTTON ── */
      .bar-toggle {
        background: none;
        border: 1px solid var(--border);
        color: var(--dim);
        font-family: var(--mono);
        font-size: 10px;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        letter-spacing: .06em;
        text-transform: uppercase;
        transition: all .15s;
        white-space: nowrap;
      }
      .bar-toggle:hover { border-color: rgba(255,255,255,0.2); color: var(--text); }
      .bar-toggle.on { background: var(--acc-lo); border-color: var(--acc); color: var(--acc); }

      /* ── RESET BTN ── */
      #reset-btn {
        background: none;
        border: none;
        color: var(--dim);
        font-family: var(--mono);
        font-size: 10px;
        cursor: pointer;
        letter-spacing: .06em;
        text-transform: uppercase;
        padding: 5px 4px;
        transition: color .12s;
      }
      #reset-btn:hover { color: var(--text); }

      /* ── MISSING ASSETS PANEL ── */
      #rs-missing {
        position: fixed;
        top: 16px;
        right: 16px;
        background: var(--surf);
        border: 1px solid rgba(217,79,79,0.4);
        backdrop-filter: blur(12px);
        border-radius: 4px;
        padding: 12px 14px;
        z-index: 50;
        font-family: var(--mono);
        max-width: 280px;
        display: none;
      }
      #rs-missing.visible { display: block; }
      #rs-missing-header {
        font-size: 10px;
        letter-spacing: .1em;
        color: var(--red);
        text-transform: uppercase;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #rs-missing-close {
        background: none;
        border: none;
        color: var(--dim);
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        padding: 0 2px;
      }
      #rs-missing-list {
        font-size: 10px;
        color: rgba(217,79,79,0.7);
        line-height: 1.7;
      }
      #rs-missing-list span { color: var(--text); }

      /* ── SHORTCUT HINT ── */
      #rs-hint {
        position: fixed;
        top: 16px;
        left: 16px;
        font-family: var(--mono);
        font-size: 9px;
        color: var(--dim);
        letter-spacing: .06em;
        line-height: 2;
        pointer-events: none;
        z-index: 50;
      }
    `;
    document.head.appendChild(style);

    // Wrapper (for scoping)
    const ui = document.createElement('div');
    ui.id = 'rs-ui';
    document.body.appendChild(ui);

    // ── Bottom bar ──────────────────────────────────────────────────────────
    const bar = document.createElement('div');
    bar.id = 'rs-bottom';
    bar.innerHTML = `
      <div class="bar-segment">
        <span class="bar-label">Explode</span>
        <input type="range" id="explode-slider" min="0" max="100" value="0" step="1">
        <span id="explode-val">0%</span>
        <button id="reset-btn" title="Reset (R)">↺</button>
      </div>
      <div class="bar-segment">
        <span class="bar-label">Diagram</span>
        <button class="bar-toggle on" id="bg-toggle" title="Toggle background (B)">BG ON</button>
        <input type="range" id="bg-opacity-slider" min="0" max="40" value="18" step="1" title="Background opacity">
      </div>
    `;
    ui.appendChild(bar);

    // ── Keyboard hint ────────────────────────────────────────────────────────
    const hint = document.createElement('div');
    hint.id = 'rs-hint';
    hint.innerHTML = `
      DRAG — PAN<br>
      SCROLL — ZOOM<br>
      CLICK — SELECT<br>
      B — BG TOGGLE<br>
      R — RESET<br>
      ESC — DESELECT
    `;
    ui.appendChild(hint);

    // ── Missing assets panel (hidden until populated) ─────────────────────
    const missing = document.createElement('div');
    missing.id = 'rs-missing';
    missing.innerHTML = `
      <div id="rs-missing-header">
        Missing Assets
        <button id="rs-missing-close">×</button>
      </div>
      <div id="rs-missing-list"></div>
    `;
    ui.appendChild(missing);

    // ── Wire events ──────────────────────────────────────────────────────────
    this._wireEvents();
  }

  _wireEvents() {
    const viewer = this.viewer;

    // Explode slider
    const slider  = document.getElementById('explode-slider');
    const valDisp = document.getElementById('explode-val');
    slider.addEventListener('input', () => {
      const pct = parseInt(slider.value);
      valDisp.textContent = pct + '%';
      viewer.setExplode(pct / 100);
    });

    // Reset
    document.getElementById('reset-btn').addEventListener('click', () => {
      this._resetExplode();
    });

    // Background toggle
    const bgToggle = document.getElementById('bg-toggle');
    bgToggle.addEventListener('click', () => {
      viewer.toggleBackground();
      const isOn = viewer.showBgDiagram;
      bgToggle.textContent = isOn ? 'BG ON' : 'BG OFF';
      bgToggle.classList.toggle('on', isOn);
      document.getElementById('bg-opacity-slider').disabled = !isOn;
    });

    // Background opacity
    const bgOpacity = document.getElementById('bg-opacity-slider');
    bgOpacity.addEventListener('input', () => {
      viewer.setBackgroundOpacity(parseInt(bgOpacity.value) / 100);
    });

    // Missing panel close
    document.getElementById('rs-missing-close').addEventListener('click', () => {
      document.getElementById('rs-missing').classList.remove('visible');
    });
  }

  _bindKeys() {
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key.toLowerCase()) {
        case 'r': this._resetExplode(); break;
        case 'b': document.getElementById('bg-toggle').click(); break;
        case 'escape': this.viewer.infoPanel.hide(); break;
      }
    });
  }

  _resetExplode() {
    const slider = document.getElementById('explode-slider');
    slider.value = '0';
    document.getElementById('explode-val').textContent = '0%';
    this.viewer.setExplode(0);
  }

  // ── MISSING ASSETS ───────────────────────────────────────────────────────────
  showMissingAssets(missing) {
    const panel = document.getElementById('rs-missing');
    const list  = document.getElementById('rs-missing-list');
    list.innerHTML = missing.map(m =>
      `<div>Label <span>${m.label}</span> — ${m.segment_image}</div>`
    ).join('');
    panel.classList.add('visible');
  }
}
