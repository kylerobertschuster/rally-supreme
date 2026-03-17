/**
 * InfoPanel.js
 * Rally Supreme — Part Detail Panel
 *
 * Renders into a fixed panel on the right side of the screen.
 * Styled in JS to keep the Vite src self-contained.
 * show(part) / hide() / showError(msg)
 */

export class InfoPanel {
  constructor() {
    this._build();
  }

  _build() {
    // Inject panel styles
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap');

      #rs-info-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 300px;
        height: 100%;
        background: rgba(13,13,13,0.92);
        border-left: 1px solid rgba(255,255,255,0.07);
        backdrop-filter: blur(20px);
        font-family: 'DM Mono', monospace;
        color: #e8e4de;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 40;
        overflow: hidden;
      }

      #rs-info-panel.open {
        transform: translateX(0);
      }

      .ip-header {
        padding: 20px 20px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-shrink: 0;
      }

      .ip-badge {
        width: 36px;
        height: 36px;
        background: #e85c2e;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Bebas Neue', sans-serif;
        font-size: 20px;
        color: white;
        flex-shrink: 0;
        margin-right: 12px;
        margin-top: 2px;
      }

      .ip-title-wrap { flex: 1; min-width: 0; }

      .ip-name {
        font-family: 'Bebas Neue', sans-serif;
        font-size: 24px;
        letter-spacing: 0.04em;
        line-height: 1.1;
        margin-bottom: 3px;
      }

      .ip-pn {
        font-size: 11px;
        color: #c8952a;
        letter-spacing: 0.06em;
      }

      .ip-close {
        background: none;
        border: none;
        color: #555;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        margin-left: 8px;
        flex-shrink: 0;
        transition: color .12s;
      }
      .ip-close:hover { color: #e8e4de; }

      .ip-body {
        flex: 1;
        overflow-y: auto;
        padding: 18px 20px;
      }
      .ip-body::-webkit-scrollbar { width: 3px; }
      .ip-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }

      .ip-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 14px;
      }

      .ip-cell {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 3px;
        padding: 10px 12px;
      }

      .ip-cell-key {
        font-size: 9px;
        letter-spacing: 0.1em;
        color: #555;
        text-transform: uppercase;
        margin-bottom: 4px;
      }

      .ip-cell-val {
        font-size: 14px;
        font-weight: 500;
        color: #e8e4de;
      }

      .ip-cell-val.accent { color: #e85c2e; }
      .ip-cell-val.gold   { color: #c8952a; }

      .ip-notes {
        padding: 10px 12px;
        background: rgba(232,92,46,0.07);
        border: 1px solid rgba(232,92,46,0.18);
        border-radius: 3px;
        font-size: 11px;
        color: #999;
        line-height: 1.6;
        font-style: italic;
        margin-bottom: 14px;
      }

      .ip-superseded {
        padding: 10px 12px;
        background: rgba(200,149,42,0.08);
        border: 1px solid rgba(200,149,42,0.2);
        border-radius: 3px;
        font-size: 10px;
        color: #c8952a;
        letter-spacing: 0.04em;
        margin-bottom: 14px;
      }
      .ip-superseded b { color: #e8e4de; }

      .ip-empty {
        padding: 40px 0;
        text-align: center;
        color: #444;
        font-size: 11px;
        line-height: 1.8;
      }

      .ip-error {
        padding: 16px;
        background: rgba(217,79,79,0.1);
        border: 1px solid rgba(217,79,79,0.3);
        border-radius: 3px;
        color: #d94f4f;
        font-size: 11px;
        line-height: 1.6;
      }

      .ip-section-label {
        font-size: 9px;
        letter-spacing: 0.12em;
        color: #444;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
    `;
    document.head.appendChild(style);

    // Panel element
    this.el = document.createElement('div');
    this.el.id = 'rs-info-panel';
    this.el.innerHTML = `
      <div class="ip-header">
        <div class="ip-empty" style="padding:20px 0;text-align:left;flex:1">
          Click a part<br>to inspect it
        </div>
      </div>
    `;
    document.body.appendChild(this.el);
  }

  show(part) {
    this.el.innerHTML = `
      <div class="ip-header">
        <div class="ip-badge">${part.label}</div>
        <div class="ip-title-wrap">
          <div class="ip-name">${part.name}</div>
          <div class="ip-pn">${part.part_number}</div>
        </div>
        <button class="ip-close" id="ip-close-btn">×</button>
      </div>
      <div class="ip-body">

        <div class="ip-grid">
          <div class="ip-cell">
            <div class="ip-cell-key">Qty</div>
            <div class="ip-cell-val accent">× ${part.qty}</div>
          </div>
          <div class="ip-cell">
            <div class="ip-cell-key">Label</div>
            <div class="ip-cell-val">${part.label}</div>
          </div>
          <div class="ip-cell" style="grid-column:1/-1">
            <div class="ip-cell-key">Part Number</div>
            <div class="ip-cell-val gold">${part.part_number}</div>
          </div>
        </div>

        ${part.notes ? `
          <div class="ip-section-label">Service Notes</div>
          <div class="ip-notes">${part.notes}</div>
        ` : ''}

        ${part.superseded_by ? `
          <div class="ip-superseded">
            SUPERSEDED BY <b>${part.superseded_by}</b>
          </div>
        ` : ''}

      </div>
    `;

    this.el.classList.add('open');

    document.getElementById('ip-close-btn')?.addEventListener('click', () => this.hide());
  }

  hide() {
    this.el.classList.remove('open');
  }

  showError(message) {
    this.el.innerHTML = `
      <div class="ip-header">
        <div class="ip-title-wrap">
          <div class="ip-name" style="color:#d94f4f">ERROR</div>
        </div>
      </div>
      <div class="ip-body">
        <div class="ip-error">${message}</div>
      </div>
    `;
    this.el.classList.add('open');
  }
}
