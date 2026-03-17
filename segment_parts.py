#!/usr/bin/env python3
"""
segment_parts.py
Rally Supreme — Part Segmentation Pipeline

Reads:
  - public/data/{slug}/assembly.json   (for canvas dimensions)
  - public/data/{slug}/placements.json (for bbox per part)
  - public/data/{slug}/diagram.png     (source fiche image)

Writes:
  - public/data/{slug}/parts/001.png
  - public/data/{slug}/parts/002.png
  - ...

Usage:
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch --no-rembg
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch --padding 0.05
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch --labels 1,2,3
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch --validate-only

Install dependencies:
  pip install rembg pillow onnxruntime opencv-python

  opencv-python is optional but recommended — improves segmentation quality
  on Honda/KTM line art diagrams by sharpening edges before rembg runs.
  rembg will download its ONNX model (~170MB) on first run.
  If you can't install rembg, use --no-rembg to get plain crops with
  white background removed via simple threshold.
"""

import argparse
import json
import os
import sys
from pathlib import Path


# ── CONSTANTS ─────────────────────────────────────────────────────────────────

DATA_DIR = Path("public/data")
MIN_CROP_PX = 8          # minimum crop dimension in pixels (skip smaller)
DEFAULT_PADDING = 0.02   # normalized padding added around each bbox
THUMB_SIZE = (800, 800)  # max thumbnail size to prevent memory issues with rembg


# ── FILENAME RULE (matches placement-tool.html and PIPELINE.md) ───────────────

def label_to_filename(label: str) -> str:
    """
    Convert a part label to its segment filename.
    Matches the rule in placement-tool.html and PIPELINE.md exactly.

    '1'   → 'parts/001.png'
    '10'  → 'parts/010.png'
    '11a' → 'parts/11a.png'  (non-numeric: use label as-is)
    """
    try:
        n = int(label)
        return f"parts/{str(n).zfill(3)}.png"
    except ValueError:
        return f"parts/{label}.png"


# ── VALIDATION ────────────────────────────────────────────────────────────────

def validate(assembly: dict, placements: list, diagram_path: Path) -> list[str]:
    """
    Run the PIPELINE.md Section 8 checklist.
    Returns a list of error strings. Empty list = valid.
    """
    errors = []

    # Check diagram exists
    if not diagram_path.exists():
        errors.append(f"diagram not found: {diagram_path}")
        return errors  # can't continue without diagram

    # Check canvas matches actual image
    try:
        from PIL import Image
        with Image.open(diagram_path) as img:
            actual_w, actual_h = img.size
        expected_w = assembly.get("canvas", {}).get("width")
        expected_h = assembly.get("canvas", {}).get("height")
        if expected_w and actual_w != expected_w:
            errors.append(
                f"canvas.width mismatch: assembly.json says {expected_w}, "
                f"diagram.png is {actual_w}"
            )
        if expected_h and actual_h != expected_h:
            errors.append(
                f"canvas.height mismatch: assembly.json says {expected_h}, "
                f"diagram.png is {actual_h}"
            )
    except ImportError:
        pass  # PIL not available at validation time

    # Check required fields per placement
    required_fields = ["label", "x", "y", "z", "depth_order",
                       "explode_vector", "segment_image", "bbox", "anchor"]
    seen_labels = set()

    for i, p in enumerate(placements):
        label = p.get("label", f"[index {i}]")

        # Duplicate label check
        if label in seen_labels:
            errors.append(f"duplicate label: '{label}'")
        seen_labels.add(label)

        # Required fields
        for field in required_fields:
            if field not in p:
                errors.append(f"label '{label}': missing field '{field}'")

        # bbox validity
        bbox = p.get("bbox", {})
        for k in ["x", "y", "w", "h"]:
            if k not in bbox:
                errors.append(f"label '{label}': missing bbox.{k}")
            else:
                v = bbox[k]
                if not (0.0 <= v <= 1.0):
                    errors.append(
                        f"label '{label}': bbox.{k} = {v} is outside 0.0–1.0"
                    )
        if "x" in bbox and "w" in bbox and (bbox["x"] + bbox["w"]) > 1.001:
            errors.append(
                f"label '{label}': bbox.x ({bbox['x']}) + bbox.w ({bbox['w']}) "
                f"exceeds 1.0"
            )
        if "y" in bbox and "h" in bbox and (bbox["y"] + bbox["h"]) > 1.001:
            errors.append(
                f"label '{label}': bbox.y ({bbox['y']}) + bbox.h ({bbox['h']}) "
                f"exceeds 1.0"
            )

        # explode_vector length
        ev = p.get("explode_vector", [])
        if not isinstance(ev, list) or len(ev) != 3:
            errors.append(
                f"label '{label}': explode_vector must be [x, y, z] with 3 values"
            )

        # segment_image matches filename rule
        expected_seg = label_to_filename(label)
        actual_seg = p.get("segment_image", "")
        if actual_seg != expected_seg:
            errors.append(
                f"label '{label}': segment_image is '{actual_seg}', "
                f"expected '{expected_seg}' per PIPELINE.md"
            )

    return errors


# ── SIMPLE BACKGROUND REMOVAL (fallback when rembg not available) ──────────────

def simple_remove_bg(img):
    """
    Naive white/light background removal.
    Works on typical fiche diagrams which have white or near-white backgrounds.
    Not as good as rembg but requires no ML model.
    """
    from PIL import Image
    import struct

    rgba = img.convert("RGBA")
    data = rgba.getdata()
    new_data = []
    for r, g, b, a in data:
        # Treat near-white pixels as transparent
        lightness = (r + g + b) / 3
        if lightness > 230 and abs(r - g) < 20 and abs(g - b) < 20:
            new_data.append((r, g, b, 0))
        else:
            new_data.append((r, g, b, a))
    rgba.putdata(new_data)
    return rgba


# ── OPENCV PREPROCESSING ──────────────────────────────────────────────────────

def preprocess_for_segmentation(img):
    """
    Preprocess a PIL crop before rembg to improve segmentation quality
    on Honda-style line art diagrams (white background, black lines).

    What it does:
      - Boosts contrast so faint lines become solid
      - Sharpens edges so rembg sees clean boundaries
      - Does NOT change the image dimensions or color space

    Only runs if opencv-python is installed. Falls back silently if not.
    Safe to call on any image type — returns original if preprocessing fails.
    """
    try:
        import cv2
        import numpy as np
    except ImportError:
        return img  # opencv not installed — skip silently

    try:
        # PIL → OpenCV (RGB)
        cv_img = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)

        # 1. Mild denoise — removes CMSNL watermark artifacts and GIF noise
        denoised = cv2.fastNlMeansDenoisingColored(cv_img, None, 3, 3, 7, 21)

        # 2. Sharpen — makes part boundaries crisper for rembg
        kernel = np.array([
            [ 0, -1,  0],
            [-1,  5, -1],
            [ 0, -1,  0]
        ])
        sharpened = cv2.filter2D(denoised, -1, kernel)

        # 3. Contrast boost via CLAHE on L channel (Lab colorspace)
        lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2Lab)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(4, 4))
        l_boosted = clahe.apply(l)
        lab_boosted = cv2.merge([l_boosted, a, b])
        result = cv2.cvtColor(lab_boosted, cv2.COLOR_Lab2BGR)

        # OpenCV → PIL
        return Image.fromarray(cv2.cvtColor(result, cv2.COLOR_BGR2RGB))

    except Exception:
        return img  # any failure → return original unchanged


# ── MAIN SEGMENTATION ─────────────────────────────────────────────────────────

def segment(
    slug: str,
    padding: float = DEFAULT_PADDING,
    use_rembg: bool = True,
    labels_filter: list[str] | None = None,
    validate_only: bool = False,
    dry_run: bool = False,
    quiet: bool = False,
) -> bool:
    """
    Main segmentation routine. Returns True on success.
    """

    def log(msg, level="INFO"):
        if not quiet or level in ("ERROR", "WARN"):
            prefix = {"INFO": "  ", "OK": "✓ ", "WARN": "⚠ ", "ERROR": "✗ "}
            print(f"{prefix.get(level, '  ')}{msg}")

    # ── Locate files ──────────────────────────────────────────────────────────
    assembly_dir = DATA_DIR / slug
    assembly_path = assembly_dir / "assembly.json"
    placements_path = assembly_dir / "placements.json"
    diagram_path = assembly_dir / "diagram.png"
    parts_dir = assembly_dir / "parts"

    log(f"Assembly: {slug}")
    log(f"Directory: {assembly_dir.resolve()}")

    # Check files exist
    for path, name in [
        (assembly_path, "assembly.json"),
        (placements_path, "placements.json"),
        (diagram_path, "diagram.png"),
    ]:
        if not path.exists():
            log(f"{name} not found: {path}", "ERROR")
            return False

    # ── Load JSON ─────────────────────────────────────────────────────────────
    with open(assembly_path) as f:
        assembly = json.load(f)
    with open(placements_path) as f:
        placements = json.load(f)

    log(f"Loaded {len(placements)} placements")

    # ── Validate ──────────────────────────────────────────────────────────────
    log("Validating against PIPELINE.md contract...")
    errors = validate(assembly, placements, diagram_path)
    if errors:
        log(f"{len(errors)} validation error(s):", "ERROR")
        for e in errors:
            log(f"  → {e}", "ERROR")
        if validate_only:
            return False
        log("Continuing despite errors (--force not set stops here in strict mode)", "WARN")
    else:
        log("Validation passed", "OK")

    if validate_only:
        log("Validate-only mode. Done.")
        return True

    # ── Load image ────────────────────────────────────────────────────────────
    try:
        from PIL import Image
    except ImportError:
        log("Pillow not installed. Run: pip install pillow", "ERROR")
        return False

    with Image.open(diagram_path) as img:
        diagram = img.convert("RGBA")
        img_w, img_h = diagram.size

    log(f"Diagram: {img_w} × {img_h} px")

    # Override canvas dimensions from actual image (safer)
    actual_canvas = {"width": img_w, "height": img_h}

    # ── Setup rembg ───────────────────────────────────────────────────────────
    remove_fn = None
    if use_rembg:
        try:
            from rembg import remove as rembg_remove
            remove_fn = rembg_remove
            log("rembg loaded (ML background removal)", "OK")
        except ImportError:
            log("rembg not installed — falling back to threshold removal", "WARN")
            log("  Install: pip install rembg onnxruntime", "WARN")
            remove_fn = simple_remove_bg
    else:
        log("Using threshold background removal (--no-rembg)", "WARN")
        remove_fn = simple_remove_bg

    # ── Create output directory ───────────────────────────────────────────────
    if not dry_run:
        parts_dir.mkdir(parents=True, exist_ok=True)

    # ── Filter placements ─────────────────────────────────────────────────────
    if labels_filter:
        to_process = [p for p in placements if p["label"] in labels_filter]
        log(f"Filtering to labels: {labels_filter} ({len(to_process)} placements)")
    else:
        to_process = placements

    # ── Segment each part ─────────────────────────────────────────────────────
    success_count = 0
    skip_count = 0
    error_count = 0

    for placement in to_process:
        label = placement["label"]
        bbox = placement["bbox"]
        out_filename = label_to_filename(label)
        out_path = assembly_dir / out_filename

        # Compute pixel crop with padding
        pad_x = padding * img_w
        pad_y = padding * img_h

        left   = max(0, bbox["x"] * img_w - pad_x)
        top    = max(0, bbox["y"] * img_h - pad_y)
        right  = min(img_w, (bbox["x"] + bbox["w"]) * img_w + pad_x)
        bottom = min(img_h, (bbox["y"] + bbox["h"]) * img_h + pad_y)

        crop_w = right - left
        crop_h = bottom - top

        if crop_w < MIN_CROP_PX or crop_h < MIN_CROP_PX:
            log(f"Label {label:>3}: skipping — crop too small ({crop_w:.0f}×{crop_h:.0f}px)", "WARN")
            skip_count += 1
            continue

        if dry_run:
            log(f"Label {label:>3}: [DRY RUN] would crop ({left:.0f},{top:.0f}) → ({right:.0f},{bottom:.0f}) → {out_filename}")
            success_count += 1
            continue

        try:
            # Crop from diagram
            crop = diagram.crop((int(left), int(top), int(right), int(bottom)))

            # Thumbnail for rembg (prevents OOM on large diagrams)
            processing_crop = crop.copy()
            scale = 1.0
            if max(crop_w, crop_h) > THUMB_SIZE[0]:
                processing_crop.thumbnail(THUMB_SIZE, Image.LANCZOS)
                scale = processing_crop.width / crop.width

            # OpenCV preprocessing — sharpens lines, boosts contrast
            # Improves rembg quality on Honda/KTM line art diagrams
            processing_crop = preprocess_for_segmentation(processing_crop)

            # Background removal
            result = remove_fn(processing_crop)

            # Scale back up if we thumbnailed
            if scale < 1.0:
                result = result.resize(
                    (int(processing_crop.width / scale),
                     int(processing_crop.height / scale)),
                    Image.LANCZOS
                )

            # Save
            result.save(out_path, "PNG", optimize=True)

            size_kb = out_path.stat().st_size / 1024
            log(f"Label {label:>3}: {out_filename:>20}  {crop_w:.0f}×{crop_h:.0f}px  →  {size_kb:.1f}KB", "OK")
            success_count += 1

        except Exception as e:
            log(f"Label {label:>3}: FAILED — {e}", "ERROR")
            error_count += 1

    # ── Summary ───────────────────────────────────────────────────────────────
    print()
    print(f"  ─────────────────────────────────────")
    print(f"  Done: {success_count} segmented, {skip_count} skipped, {error_count} errors")
    if not dry_run and success_count > 0:
        print(f"  Output: {(assembly_dir / 'parts').resolve()}")
    print()

    return error_count == 0


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Rally Supreme — Part Segmentation Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch --no-rembg
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch --padding 0.04
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch --labels 1,2,3
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch --validate-only
  python segment_parts.py --slug ktm-500-exc-f-2025-clutch --dry-run
        """,
    )

    parser.add_argument(
        "--slug",
        required=True,
        help="Assembly slug (must match public/data/{slug}/ directory)",
    )
    parser.add_argument(
        "--padding",
        type=float,
        default=DEFAULT_PADDING,
        help=f"Normalized padding added around each bbox (default: {DEFAULT_PADDING})",
    )
    parser.add_argument(
        "--no-rembg",
        action="store_true",
        help="Skip rembg ML removal; use simple threshold removal instead",
    )
    parser.add_argument(
        "--labels",
        type=str,
        default=None,
        help="Comma-separated list of labels to process (default: all)",
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate placements.json against PIPELINE.md. Do not segment.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be done without writing any files.",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress INFO output. Only show warnings and errors.",
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default="public/data",
        help="Base data directory (default: public/data)",
    )

    args = parser.parse_args()

    # Allow overriding DATA_DIR
    global DATA_DIR
    DATA_DIR = Path(args.data_dir)

    labels_filter = None
    if args.labels:
        labels_filter = [l.strip() for l in args.labels.split(",")]

    print()
    print("  RALLY SUPREME — Segment Parts")
    print("  ─────────────────────────────────────")

    ok = segment(
        slug=args.slug,
        padding=args.padding,
        use_rembg=not args.no_rembg,
        labels_filter=labels_filter,
        validate_only=args.validate_only,
        dry_run=args.dry_run,
        quiet=args.quiet,
    )

    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()