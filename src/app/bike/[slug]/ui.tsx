"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Bike, Diagram, Hotspot, Part } from "@/lib/types";
import { BikeCanvas } from "@/components/BikeCanvas";
import { Bike3DCanvas } from "@/components/Bike3DCanvas";
import { PartDrawer } from "@/components/PartDrawer";
import { CategorizedPartsList } from "@/components/CategorizedPartsList";

function CanvasLoading() {
  return (
    <div className="relative h-screen bg-[#e6e6e6] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/20 border-t-black/60"></div>
        </div>
        <p className="mt-4 text-sm text-black/60">Loading 3D model...</p>
      </div>
    </div>
  );
}

export default function BikeClient({
  bike,
  diagram,
  parts,
  hotspots,
}: {
  bike: Bike;
  diagram: Diagram;
  parts: Part[];
  hotspots: Hotspot[];
}) {
  // local, mutable copy of parts so we can apply replacements
  const [localParts, setLocalParts] = useState<Part[]>(parts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const selectionSourceRef = useRef<"canvas" | "index" | null>(null);

  useEffect(() => {
    // listen for replacement events from PartDrawer
    function onReplace(e: Event) {
      const ev = e as CustomEvent<{ originalId: string; alternative: Part }>;
      const { originalId, alternative } = ev.detail;
      setLocalParts((prev) =>
        prev.map((p) => (p.id === originalId ? { ...p, replacement: alternative } : p))
      );
      // show the updated part in the drawer
      setSelectedId(originalId);
    }

    window.addEventListener("part:replace", onReplace as EventListener);
    return () => window.removeEventListener("part:replace", onReplace as EventListener);
  }, []);

  const selectedPart = useMemo(
    () => localParts.find((p) => p.id === selectedId) ?? null,
    [localParts, selectedId]
  );

  // Auto-open Index only when selection comes from canvas (not from index list)
  useEffect(() => {
    if (selectionSourceRef.current === "canvas" && selectedId && !indexOpen) {
      setIndexOpen(true);
      selectionSourceRef.current = null; // Reset source after opening
    }
  }, [selectedId, indexOpen]);

  return (
    <div className="relative min-h-screen bg-[#e6e6e6] text-black">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/10 bg-[#e6e6e6]/95 px-4 py-3 backdrop-blur">
        <div className="text-sm uppercase tracking-[0.3em] text-black/60">
          {bike.year ? `${bike.year} ` : ""}
          {bike.name}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black/70 hover:border-black/40"
            onClick={() => setIndexOpen(true)}
          >
            Index
          </button>
        </div>
      </header>

      <Suspense fallback={<CanvasLoading />}>
        {diagram.viewer === "three" ? (
          <Bike3DCanvas
            modelUrl={diagram.modelUrl}
            parts={localParts}
            selectedPartId={selectedId}
            onSelectPart={(id) => {
              selectionSourceRef.current = "canvas";
              setSelectedId(id);
            }}
          />
        ) : (
          <BikeCanvas
            diagram={diagram}
            hotspots={hotspots}
            selectedPartId={selectedId}
            onSelectPart={(id) => {
              selectionSourceRef.current = "canvas";
              setSelectedId(id);
            }}
          />
        )}
      </Suspense>

      <PartDrawer part={selectedPart} onClose={() => setSelectedId(null)} />

      <div
        className={[
          "fixed inset-0 z-50 bg-[#f2f2f2]/95 backdrop-blur transition-opacity",
          indexOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.3em] text-black/60">
              Index
            </div>
            <button
              type="button"
              className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black/70 hover:border-black/40"
              onClick={() => setIndexOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="mt-6 text-3xl font-semibold tracking-tight">
            {bike.name}
          </div>
          <div className="mt-1 text-black/60">
            {bike.year ? `${bike.year} • ` : ""}
            {bike.manufacturer ?? "Manufacturer"}
          </div>

          <div className="mt-6 text-sm uppercase tracking-[0.2em] text-black/50">
            Parts List
          </div>
          <CategorizedPartsList
            parts={localParts}
            selectedId={selectedId}
            selectedPart={selectedPart}
            onSelectPart={(id) => {
              setSelectedId(id);
              setIndexOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
