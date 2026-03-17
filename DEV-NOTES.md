# DEV-NOTES.md
# Rally Supreme — First Real Run Log
# Assembly: ktm-500-exc-f-2025-clutch
# ─────────────────────────────────────────────────────────────
#
# HOW TO USE THIS FILE
# Run the full loop. For every friction point, write it down here.
# Don't fix things mid-run unless they block you completely.
# Finish the loop first. Fix after.
#
# Format per issue:
#   - WHAT happened
#   - WHERE in the pipeline it showed up
#   - SEVERITY: blocker / annoying / cosmetic
#   - HYPOTHESIS about cause
#   - PROPOSED FIX (leave blank if unsure)
#
# ─────────────────────────────────────────────────────────────


═══════════════════════════════════════════════════════════════
RUN LOG
═══════════════════════════════════════════════════════════════

Date:
Diagram source:
Diagram resolution:
Parts authored:
Time to author placements:
Time to segment:
Time to first working viewer:
Total loop time (raw diagram → viewer):

Did it run cleanly end-to-end? YES / NO
If no, what blocked it:


═══════════════════════════════════════════════════════════════
SECTION 1: AUTHORING TOOL FRICTION
═══════════════════════════════════════════════════════════════

# Known issues to watch for:
# ─────────────────────────────────────────────────────────────

[ ] BBOX DRAWING PRECISION
    The draw boxes may feel imprecise at lower zoom levels.
    Test: zoom to 150–200% before drawing tight boxes.
    Note whether you felt the need to re-draw boxes more than once per part.

    Observations:


[ ] LABEL NUMBERING
    The auto-suggested next label increments from the highest integer label.
    If the fiche skips numbers (e.g. 1,2,4,5 with no 3), it may suggest wrong values.
    Note any labeling confusion.

    Observations:


[ ] EXPLODE VECTOR AUTHORING
    The X/Y/Z sliders go from -3 to +3.
    For most clutch parts, useful range is probably -1.5 to +1.5.
    The arrow on the diagram canvas shows direction — is it readable at all zoom levels?
    Is the range wide enough? Too wide?

    Observations:


[ ] DEPTH ORDER
    Did you need to think about depth_order per part?
    Default is 0 for everything which means random layering.
    Note if layering looked wrong in the viewer.

    Observations:


[ ] ANYTHING THAT MADE YOU STOP AND THINK
    If you paused and weren't sure what to do, write it here.
    That pause is a UX bug.

    Observations:


═══════════════════════════════════════════════════════════════
SECTION 2: SEGMENTATION
═══════════════════════════════════════════════════════════════

[ ] REMBG QUALITY
    Expected: clean cutout with transparent background.
    Risk areas: parts with similar color to background, very thin parts (springs, circlips),
    parts that touch the diagram border.
    Note which parts came out clean vs. messy.

    Clean:
    Messy:
    Why:


[ ] CROP PADDING
    Default padding is 0.02 (2% of diagram dimensions).
    Too tight = part gets clipped.
    Too loose = background bleeds in, rembg has more to remove.
    What padding worked well?

    Observations:


[ ] PROCESSING TIME
    How long did rembg take per part?
    Acceptable for 12 parts? For 40?

    Time for full run:
    Per-part average:


[ ] FALLBACK (--no-rembg) QUALITY
    If rembg wasn't available or failed, did threshold removal work at all?
    Note which part types it failed on (likely: dark parts on dark background).

    Observations:


[ ] FILENAME MISMATCHES
    Did any segment_image paths in placements.json not match
    what segment_parts.py produced?
    This would show as orange placeholder in viewer.

    Mismatches found:


═══════════════════════════════════════════════════════════════
SECTION 3: VALIDATOR
═══════════════════════════════════════════════════════════════

[ ] FALSE POSITIVES
    Did the validator flag things that were actually fine?

    Observations:


[ ] MISSED REAL ERRORS
    Did something break in the viewer that the validator didn't catch?
    That's a gap in the contract — note it.

    Observations:


[ ] USEFUL / NOT USEFUL
    Was running validate-assembly worth the 2 seconds?
    Did it catch anything before you wasted time segmenting?

    Observations:


═══════════════════════════════════════════════════════════════
SECTION 4: VIEWER — SPRITE ALIGNMENT
═══════════════════════════════════════════════════════════════

# This is where most first-run issues will appear.
# ─────────────────────────────────────────────────────────────

[ ] SPRITE POSITION VS BACKGROUND DIAGRAM
    The background diagram is at opacity 0.18.
    Each sprite should visually sit ON TOP of the corresponding part in the ghost diagram.
    Did they align?

    Parts that aligned well:
    Parts that were offset:
    Offset direction (left/right/up/down):
    Hypothesis (bbox center wrong? anchor wrong?):


[ ] SPRITE SCALE
    Were sprites too big / too small relative to the diagram?
    The bbox.w × worldWidth calculation should match diagram proportions.
    Note any that looked wrong.

    Observations:


[ ] DEPTH LAYERING
    Did parts render in front/behind each other correctly?
    Outer cover should be in front of friction discs, etc.
    Did renderOrder do its job?

    Observations:


[ ] ORTHOGRAPHIC CAMERA
    Did the diagram fill the screen nicely at first load?
    Did it feel like the right zoom level?

    Observations:


═══════════════════════════════════════════════════════════════
SECTION 5: VIEWER — EXPLODE
═══════════════════════════════════════════════════════════════

[ ] EXPLODE FEEL
    At 50% explode, do parts look like they're being pulled apart naturally?
    Or do they scatter randomly?
    Note which parts had good vectors vs. wrong direction.

    Good vectors:
    Wrong direction:
    Parts that barely moved (vector too small):
    Parts that flew too far (vector too large):


[ ] EXPLODE DISTANCE SCALAR
    assembly.json has explode_distance: 2.0.
    Too big = parts fly off screen.
    Too small = barely any separation.
    What value felt right?

    Observations:


[ ] LERP SPEED
    LERP_SPEED is 0.1 in RallyViewer.js.
    Did the animation feel snappy enough? Laggy?

    Observations:


═══════════════════════════════════════════════════════════════
SECTION 6: VIEWER — INFO PANEL
═══════════════════════════════════════════════════════════════

[ ] CLICK ACCURACY
    Did clicking a part reliably select it?
    Or did you have to click multiple times?
    Did the 4px drag threshold cause any misses?

    Observations:


[ ] PANEL CONTENT
    Was the part name/number/qty/notes the right information?
    Anything missing that you immediately wanted to see?

    Observations:


[ ] PANEL UX
    Did the slide-in feel right? Too fast/slow?
    Did clicking empty space reliably deselect?

    Observations:


═══════════════════════════════════════════════════════════════
SECTION 7: BACKGROUND DIAGRAM
═══════════════════════════════════════════════════════════════

[ ] OPACITY
    Default is 0.18.
    Too bright (muddy)? Too dim (pointless)?
    What opacity felt right for alignment vs. aesthetics?

    Ideal opacity:


[ ] TOGGLE
    Did B key and BG ON/OFF button work reliably?

    Observations:


[ ] ALIGNMENT WITH SPRITES
    Did the ghost diagram sit correctly behind the sprites?
    Or was it offset?

    Observations:


═══════════════════════════════════════════════════════════════
SECTION 8: MISSING ASSETS PANEL
═══════════════════════════════════════════════════════════════

[ ] DID IT APPEAR WHEN EXPECTED?
    If any segment images were missing, did the orange panel appear top-right?

    Observations:


[ ] WERE PLACEHOLDERS HELPFUL OR UGLY?
    Orange dashed boxes with label numbers.
    Did they help you identify what was missing?
    Or did they pollute the demo too much?

    Observations:


═══════════════════════════════════════════════════════════════
SECTION 9: GENERAL FEEL
═══════════════════════════════════════════════════════════════

[ ] FIRST IMPRESSION
    When the viewer loaded with real parts, what did it feel like?
    Write the honest reaction.


[ ] THE "OH SHIT" MOMENT
    Was there one? What triggered it?
    If there wasn't one, what was missing?


[ ] WHAT WOULD YOU SHOW SOMEONE TONIGHT?
    If a motorcycle mechanic walked in right now, what would you show them?
    What would you hide?


[ ] TIME ESTIMATE: SECOND ASSEMBLY
    Based on this run, how long would the second assembly take?
    (This number is the most important data point from tonight.)

    Estimate:


═══════════════════════════════════════════════════════════════
SECTION 10: PRIORITIZED FIX LIST
═══════════════════════════════════════════════════════════════

# Fill this in AFTER the run.
# Rank by: does fixing this make the demo better for someone watching?

1.
2.
3.
4.
5.


═══════════════════════════════════════════════════════════════
KNOWN ISSUES (pre-seeded — confirm or close after the run)
═══════════════════════════════════════════════════════════════

These are issues predicted before the first run.
After the run, mark each: CONFIRMED / CLOSED / NOT APPLICABLE

[ ] CONFIRMED / CLOSED  Sprite anchor offset may cause misalignment on non-center anchors
[ ] CONFIRMED / CLOSED  Springs (circular arrangements) will not auto-duplicate in sprite mode
[ ] CONFIRMED / CLOSED  Z-only explode vectors on similar parts (disc stack) will look flat
[ ] CONFIRMED / CLOSED  rembg struggles with white/near-white parts on white backgrounds
[ ] CONFIRMED / CLOSED  Depth order defaults to 0, causing undefined layering on first run
[ ] CONFIRMED / CLOSED  Background opacity 0.18 may be too dim to be useful for alignment
[ ] CONFIRMED / CLOSED  Click registration may feel off at edges of small sprites
[ ] CONFIRMED / CLOSED  Pan conflicts with click on mobile (not relevant yet but note)
