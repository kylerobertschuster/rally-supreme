"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Diagram, Hotspot } from "@/lib/types";

type Vec = { x: number; y: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function BikeCanvas({
  diagram,
  hotspots,
  onSelectPart
}: {
  diagram: Diagram;
  hotspots: Hotspot[];
  onSelectPart: (partId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // CAMERA
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Vec>({ x: 0, y: 0 });

  // DRAG STATE
  const [dragging, setDragging] = useState(false);
  const last = useRef<Vec>({ x: 0, y: 0 });

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

    // Start with "fit" scale if image is bigger than viewport
    const fit = Math.min(cw / imgSize.w, ch / imgSize.h);
    const startScale = clamp(fit, 0.25, 1.5);

    setScale(startScale);
    setOffset({
      x: (cw - imgSize.w * startScale) / 2,
      y: (ch - imgSize.h * startScale) / 2
    });
  }, [imgSize]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const mouse: Vec = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.08 : 0.92;

    const nextScale = clamp(scale * zoomFactor, 0.2, 4);

    // Zoom around mouse position
    const ix = (mouse.x - offset.x) / scale;
    const iy = (mouse.y - offset.y) / scale;

    const nextOffset = {
      x: mouse.x - ix * nextScale,
      y: mouse.y - iy * nextScale
    };

    setScale(nextScale);
    setOffset(nextOffset);
  }

  function onMouseDown(e: React.MouseEvent) {
    // only left click
    if (e.button !== 0) return;
    setDragging(true);
    last.current = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }

  function onMouseUp() {
    setDragging(false);
  }

  return (
    <div className="w-full h-[70vh] rounded-3xl overflow-hidden border border-black/10 bg-[radial-gradient(circle_at_20%_20%,#ffffff,rgba(255,255,255,0.65),#e5e5e5)] shadow-[0_20px_80px_rgba(0,0,0,0.15)]">
      <div
        ref={containerRef}
        className="w-full h-full relative select-none"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* TRANSFORM LAYER: IMAGE + HOTSPOTS MOVE TOGETHER */}
        <div
          className="absolute top-0 left-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "top left"
          }}
        >
          {/* IMAGE */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={diagram.image}
            alt={diagram.label}
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            style={{
              display: "block"
            }}
          />

          {/* HOTSPOTS OVERLAY */}
          <div className="absolute top-0 left-0">
            {hotspotRects.map((hs) => (
              <button
                key={hs.partId + ":" + hs.px.x + ":" + hs.px.y}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPart(hs.partId);
                }}
                className="absolute border border-black/30 bg-black/10 hover:bg-black/20 rounded-md"
                style={{
                  left: hs.px.x,
                  top: hs.px.y,
                  width: hs.px.w,
                  height: hs.px.h
                }}
                title={hs.partId}
                aria-label={`select part ${hs.partId}`}
              />
            ))}
          </div>
        </div>

        {/* HUD */}
        <div className="absolute left-4 bottom-4 bg-white/90 border border-black/10 rounded-2xl px-4 py-3 text-xs shadow-lg">
          <div className="font-semibold">PAN: DRAG</div>
          <div className="font-semibold">ZOOM: MOUSE WHEEL</div>
          <div className="text-black/60">SCALE: {scale.toFixed(2)}</div>
        </div>

        <div className="absolute right-4 top-4 rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-xs shadow-lg">
          <div className="font-semibold">INTERACTIVE HOTSPOTS</div>
          <div className="text-black/60">Click a region to open part details.</div>
        </div>
      </div>
    </div>
  );
}
