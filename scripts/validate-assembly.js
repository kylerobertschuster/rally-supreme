#!/usr/bin/env node
/**
 * scripts/validate-assembly.js
 * Rally Supreme — Assembly Validator
 *
 * Usage:
 *   node scripts/validate-assembly.js ktm-500-exc-f-2025-clutch
 *   SLUG=ktm-500-exc-f-2025-clutch npm run validate:assembly
 *
 * Checks:
 *   - All three JSON files exist and parse
 *   - assembly.json required fields present
 *   - placements.json required fields per PIPELINE.md §8
 *   - No duplicate labels
 *   - All bbox values 0.0–1.0
 *   - segment_image follows naming rule
 *   - parts/*.png files actually exist on disk
 *   - parts.json labels match placements.json labels (warn on mismatch)
 *
 * Exit codes:
 *   0 = all clear
 *   1 = errors found
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

// ── UTILS ─────────────────────────────────────────────────────────────────────
const ok   = msg => console.log(`  ✓  ${msg}`);
const warn = msg => console.log(`  ⚠  ${msg}`);
const err  = msg => console.log(`  ✗  ${msg}`);

function labelToFilename(label) {
  const n = parseInt(label);
  return isNaN(n)
    ? `parts/${label}.png`
    : `parts/${String(n).padStart(3, '0')}.png`;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
const slug = process.argv[2] || process.env.SLUG;

if (!slug) {
  console.error('\nUsage: node scripts/validate-assembly.js <slug>\n');
  process.exit(1);
}

console.log(`\n  RALLY SUPREME — Validate Assembly`);
console.log(`  ────────────────────────────────────`);
console.log(`  Slug: ${slug}\n`);

const dataDir     = path.join(ROOT, 'public', 'data', slug);
const assemblyP   = path.join(dataDir, 'assembly.json');
const partsP      = path.join(dataDir, 'parts.json');
const placementsP = path.join(dataDir, 'placements.json');
const diagramP    = path.join(dataDir, 'diagram.png');

let errorCount = 0;
let warnCount  = 0;

function fail(msg)    { err(msg);  errorCount++; }
function caution(msg) { warn(msg); warnCount++;  }

// ── Check directory ───────────────────────────────────────────────────────────
if (!fs.existsSync(dataDir)) {
  fail(`Directory not found: ${dataDir}`);
  process.exit(1);
}

// ── Check diagram.png ─────────────────────────────────────────────────────────
if (!fs.existsSync(diagramP)) {
  fail('diagram.png not found');
} else {
  ok('diagram.png exists');
}

// ── Load and parse JSON files ─────────────────────────────────────────────────
let assembly, parts, placements;

for (const [fpath, varname, required] of [
  [assemblyP,   'assembly',   true],
  [partsP,      'parts',      true],
  [placementsP, 'placements', true],
]) {
  if (!fs.existsSync(fpath)) {
    fail(`${path.basename(fpath)} not found`);
    continue;
  }
  try {
    const data = JSON.parse(fs.readFileSync(fpath, 'utf8'));
    if (varname === 'assembly')   assembly   = data;
    if (varname === 'parts')      parts      = data;
    if (varname === 'placements') placements = data;
    ok(`${path.basename(fpath)} parsed`);
  } catch (e) {
    fail(`${path.basename(fpath)} is invalid JSON: ${e.message}`);
  }
}

if (!assembly || !parts || !placements) {
  console.log(`\n  Cannot continue — missing files.\n`);
  process.exit(1);
}

// ── assembly.json ─────────────────────────────────────────────────────────────
console.log(`\n  assembly.json`);
const aRequired = ['slug', 'brand', 'model', 'year', 'assembly', 'diagram_image',
                   'canvas', 'viewer_defaults', 'source'];
aRequired.forEach(f => {
  if (assembly[f] == null) fail(`  missing field: ${f}`);
});
if (assembly.canvas) {
  if (!assembly.canvas.width)  fail('  canvas.width missing');
  if (!assembly.canvas.height) fail('  canvas.height missing');
}
if (assembly.slug !== slug) {
  fail(`  slug mismatch: assembly.json says "${assembly.slug}", directory is "${slug}"`);
} else {
  ok(`  slug matches directory`);
}

// ── placements.json ───────────────────────────────────────────────────────────
console.log(`\n  placements.json (${placements.length} placements)`);

const required = ['label','x','y','z','depth_order','explode_vector','segment_image','bbox','anchor'];
const seenLabels = new Set();

placements.forEach((p, i) => {
  const label = p.label ?? `[${i}]`;

  if (seenLabels.has(label)) fail(`  duplicate label: "${label}"`);
  seenLabels.add(label);

  required.forEach(f => {
    if (p[f] == null) fail(`  label ${label}: missing "${f}"`);
  });

  if (p.bbox) {
    ['x','y','w','h'].forEach(k => {
      if (p.bbox[k] == null) {
        fail(`  label ${label}: missing bbox.${k}`);
      } else if (p.bbox[k] < 0 || p.bbox[k] > 1) {
        fail(`  label ${label}: bbox.${k} = ${p.bbox[k]} out of 0–1 range`);
      }
    });
    if ((p.bbox.x ?? 0) + (p.bbox.w ?? 0) > 1.001)
      fail(`  label ${label}: bbox.x + bbox.w > 1.0`);
    if ((p.bbox.y ?? 0) + (p.bbox.h ?? 0) > 1.001)
      fail(`  label ${label}: bbox.y + bbox.h > 1.0`);
  }

  if (p.explode_vector && (!Array.isArray(p.explode_vector) || p.explode_vector.length !== 3))
    fail(`  label ${label}: explode_vector must be [x, y, z]`);

  const expectedSeg = labelToFilename(label);
  if (p.segment_image && p.segment_image !== expectedSeg) {
    fail(`  label ${label}: segment_image is "${p.segment_image}", expected "${expectedSeg}"`);
  }
});

ok(`  ${placements.length} placements validated`);

// ── parts.json ────────────────────────────────────────────────────────────────
console.log(`\n  parts.json (${parts.length} parts)`);

const partLabels      = new Set(parts.map(p => String(p.label)));
const placementLabels = new Set(placements.map(p => String(p.label)));

parts.forEach(p => {
  if (!p.label)       fail(`  part missing label`);
  if (!p.part_number) fail(`  label ${p.label}: missing part_number`);
  if (!p.name)        fail(`  label ${p.label}: missing name`);
  if (!p.qty)         fail(`  label ${p.label}: missing qty`);
});

// Cross-reference warnings
placementLabels.forEach(l => {
  if (!partLabels.has(l)) caution(`  placement "${l}" has no matching part in parts.json`);
});
partLabels.forEach(l => {
  if (!placementLabels.has(l)) caution(`  part "${l}" has no matching placement in placements.json`);
});

ok(`  parts.json validated`);

// ── Segment images on disk ────────────────────────────────────────────────────
console.log(`\n  Segment images`);

let missingCount = 0;
placements.forEach(p => {
  const imgPath = path.join(dataDir, p.segment_image);
  if (!fs.existsSync(imgPath)) {
    caution(`  MISSING: ${p.segment_image}  (label ${p.label})`);
    missingCount++;
  }
});

if (missingCount === 0) {
  ok(`  All ${placements.length} segment images present`);
} else {
  warn(`  ${missingCount} segment image(s) missing — run segment_parts.py`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n  ────────────────────────────────────`);

if (errorCount === 0 && warnCount === 0) {
  console.log(`  ✓  ALL CLEAR — ${slug}\n`);
} else {
  if (errorCount > 0) console.log(`  ✗  ${errorCount} error(s)`);
  if (warnCount  > 0) console.log(`  ⚠  ${warnCount} warning(s)`);
  console.log();
}

process.exit(errorCount > 0 ? 1 : 0);
