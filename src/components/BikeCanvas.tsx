"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { OptimizedImage } from "@/lib/imageOptimization";
import type { Diagram, Hotspot } from "@/lib/types";

type Vec = { x: number; y: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function BikeCanvas({
  diagram,
  hotspots,
  selectedPartId,
  onSelectPart,
}: {
  diagram: Diagram;
  hotspots: Hotspot[];
  selectedPartId?: string | null;
  onSelectPart: (partId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // CAMERA (static scale + centered)
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Vec>({ x: 0, y: 0 });

  const frames = useMemo(() => {
    if (!diagram.framePath || !diagram.frameCount) return [];
    const framePath = diagram.framePath;
    return Array.from({ length: diagram.frameCount }, (_, i) => {
      const index = i + 1;
      return framePath
        .replace("%04d", String(index).padStart(4, "0"))
        .replace("%d", String(index));
    });
  }, [diagram.framePath, diagram.frameCount]);

  const hasFrames = frames.length > 0;
  const [frameIndex, setFrameIndex] = useState(0);

  // ROTATION DRAG STATE
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartIndex = useRef(0);

  // IMAGE SIZE (NATURAL)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  const hotspotRects = useMemo(() => {
    // Convert hotspots to pixel rects in image-space.
    // Later we apply CSS transform to everything together (image + hotspots).
    const w = imgSize?.w ?? diagram.width ?? 1;
    const h = imgSize?.h ?? diagram.height ?? 1;

    return hotspots.map((hs) => {
      const mode = hs.mode ?? "norm";
      const x = mode === "norm" ? hs.x * w : hs.x;
      const y = mode === "norm" ? hs.y * h : hs.y;
      const rw = mode === "norm" ? hs.w * w : hs.w;
      const rh = mode === "norm" ? hs.h * h : hs.h;

      return { ...hs, px: { x, y, w: rw, h: rh } };
    });
  }, [hotspots, imgSize, diagram.width, diagram.height]);

  // INIT: CENTER IMAGE ON FIRST LOAD
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Center once when image size is known
    if (!imgSize) return;

    const cw = el.clientWidth;
    const ch = el.clientHeight;

    // Fit scale (static)
    const fit = Math.min(cw / imgSize.w, ch / imgSize.h);
    const startScale = clamp(fit, 0.25, 1.5);
    setScale(startScale);
    setOffset({
      x: (cw - imgSize.w * startScale) / 2,
      y: (ch - imgSize.h * startScale) / 2,
    });
  }, [imgSize]);

  // When the diagram changes we want the component to reset state;
  // using a `key` on the root element below ensures React remounts
  // this component when `diagram.framePath` or `diagram.frameCount`
  // change, avoiding synchronous setState inside an effect.

  function onPointerDown(e: React.PointerEvent) {
    if (!hasFrames) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setDragging(true);
    dragStartX.current = e.clientX;
    dragStartIndex.current = frameIndex;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !hasFrames) return;
    const dx = e.clientX - dragStartX.current;
    const el = containerRef.current;
    const width = el?.clientWidth ?? 1;
    const frameCount = frames.length;
    const pixelsPerFrame = Math.max(8, width / (frameCount * 1.1));
    const deltaFrames = Math.round(dx / pixelsPerFrame);
    const next = (dragStartIndex.current - deltaFrames) % frameCount;
    setFrameIndex((next + frameCount) % frameCount);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!hasFrames) return;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  const imageSrc = hasFrames ? frames[frameIndex] : diagram.image;

  return (
    <div
      key={`${diagram.framePath ?? diagram.image}-${diagram.frameCount ?? 0}`}
      className="w-full h-[78vh] overflow-hidden border-b border-black/10 bg-[#e6e6e6]"
    >
      <div
        ref={containerRef}
        className={[
          "w-full h-full relative select-none",
          hasFrames
            ? dragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default",
        ].join(" ")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ touchAction: hasFrames ? "none" : "auto" }}
      >
        {/* TRANSFORM LAYER: IMAGE + HOTSPOTS MOVE TOGETHER */}
        <div
          className="absolute top-0 left-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* IMAGE */}
          {imageSrc ? (
            <OptimizedImage
              src={imageSrc}
              alt={diagram.label}
              width={diagram.width ?? 1200}
              height={diagram.height ?? 800}
              priority={false}
              onLoadingComplete={(result) => {
                setImgSize({ w: result.naturalWidth, h: result.naturalHeight });
              }}
              style={{ display: "block" }}
            />
          ) : null}

          {/* HOTSPOTS OVERLAY (only for static diagrams) */}
          {!hasFrames && hotspotRects.length ? (
            <div className="absolute top-0 left-0">
              {hotspotRects.map((hs) => {
                const selected = selectedPartId === hs.partId;
                return (
                  <button
                    key={hs.partId + ":" + hs.px.x + ":" + hs.px.y}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPart(hs.partId);
                    }}
                    className={[
                      "absolute rounded-md border transition",
                      selected
                        ? "border-black bg-black/20"
                        : "border-black/30 bg-black/10 hover:bg-black/20",
                    ].join(" ")}
                    style={{
                      left: hs.px.x,
                      top: hs.px.y,
                      width: hs.px.w,
                      height: hs.px.h,
                    }}
                    title={hs.partId}
                    aria-label={`select part ${hs.partId}`}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
