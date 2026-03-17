# Rally Supreme
### Interactive Motorcycle Parts Fiche Viewer

---

## What This Is

A toolchain for turning 2D fiche diagrams into interactive, explorable part assemblies.
Click any part. See its name, part number, quantity, and service notes.
Drag the explode slider to pull the assembly apart and understand how it fits together.

---

## Project Structure

```
rally-supreme/
│
├── index-vite.html          ← Vite viewer entry (rename to index.html to use)
├── placement-tool.html      ← Standalone authoring tool (no server needed)
├── segment_parts.py         ← Segmentation pipeline (Python)
├── package.json
├── vite.config.js
├── PIPELINE.md              ← Canonical data contract (read this first)
│
├── src/
│   ├── main.js              ← App entry: reads ?slug= from URL
│   ├── styles/app.css
│   ├── viewer/
│   │   ├── RallyViewer.js   ← Main controller
│   │   ├── loaders.js       ← JSON + texture loading, returns {sprites, missing}
│   │   ├── scene.js         ← Three.js orthographic scene/camera/renderer
│   │   └── interaction.js   ← Raycast, hover, click-vs-drag detection
│   └── ui/
│       ├── InfoPanel.js     ← Part detail slide-in panel
│       └── Controls.js      ← Explode slider, BG toggle, missing assets warning
│
├── scripts/
│   └── validate-assembly.js ← Node validator (npm run validate:assembly <slug>)
│
└── public/data/{slug}/
    ├── assembly.json
    ├── parts.json
    ├── placements.json
    ├── diagram.png
    └── parts/001.png ...
```

---

## The Loop

```
Author (placement-tool.html)
  → Export placements.json + assembly.json

Validate
  → node scripts/validate-assembly.js <slug>

Segment
  → python3 segment_parts.py --slug <slug>

View
  → npm run dev
  → localhost:5173?slug=<slug>

Iterate
  → Import placements.json back into authoring tool
  → Adjust boxes / explode vectors
  → Re-export → re-segment specific labels → reload
```

---

## npm Scripts

```bash
npm run dev                                         # start viewer
npm run validate:assembly ktm-500-exc-f-2025-clutch # validate one assembly
npm run build                                       # production build
```

```bash
# Segmentation (Python)
python3 segment_parts.py --slug <slug>              # full ML removal
python3 segment_parts.py --slug <slug> --no-rembg   # threshold fallback
python3 segment_parts.py --slug <slug> --labels 1,3 # re-segment specific parts
python3 segment_parts.py --slug <slug> --dry-run    # preview without writing
python3 segment_parts.py --slug <slug> --validate-only
```

---

## Viewer Controls

| Input | Action |
|---|---|
| Drag | Pan |
| Scroll | Zoom |
| Click part | Select → info panel opens |
| Click empty | Deselect |
| Explode slider | 0–100% continuous explode |
| BG ON/OFF | Toggle diagram ghost layer |
| BG opacity slider | Fade diagram |
| `R` | Reset explode to 0 |
| `B` | Toggle background |
| `Esc` | Close info panel |

---

## Authoring Tool Shortcuts

| Key | Action |
|---|---|
| `D` / `S` / `P` | Draw / Select / Pan mode |
| `F` | Fit image to window |
| `E` | Export placements.json |
| `Delete` | Delete selected placement |
| `+` / `-` | Zoom |
| `Space` hold | Temporary pan |

---

## Explode Vector Conventions

```
Above center:   [0,  1.5,  0]
Below center:   [0, -1.2,  0]
Left:           [-0.8, 0,  0]
Right:          [0.8,  0,  0]
Front (cover):  [0,    0,  0.4]
Rear:           [0,    0, -0.2]
Fixed center:   [0,    0,  0]
```

Y-up = physically upward. The viewer negates Y internally (PIPELINE.md §6).

---

**When in doubt about field names, filenames, or coordinate conventions: PIPELINE.md wins.**
