"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { Bike, Diagram, Hotspot, MeshPartMappings, Part } from "@/lib/types";
import { BikeCanvas } from "@/components/BikeCanvas";
import { Bike3DCanvas } from "@/components/Bike3DCanvas";
import { PartDrawer } from "@/components/PartDrawer";
import { CategorizedPartsList } from "@/components/CategorizedPartsList";
import { BikeSelectorSidebar } from "@/components/BikeSelectorSidebar";

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
  meshMappings,
}: {
  bike: Bike;
  diagram: Diagram;
  parts: Part[];
  hotspots: Hotspot[];
  meshMappings?: MeshPartMappings;
}) {
  // local, mutable copy of parts so we can apply replacements
  const [localParts, setLocalParts] = useState<Part[]>(parts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [indexBreakawayOpen, setIndexBreakawayOpen] = useState(false);
  const [allBikes, setAllBikes] = useState<Bike[]>([]);

  // Fetch all bikes on mount
  useEffect(() => {
    async function fetchBikes() {
      try {
        const res = await fetch("/api/bikes");
        if (res.ok) {
          const data = await res.json();
          setAllBikes(data.bikes || []);
        }
      } catch (error) {
        console.warn("Failed to fetch bikes list:", error);
      }
    }

    fetchBikes();
  }, []);

  useEffect(() => {
    // listen for replacement events from PartDrawer
    function onReplace(e: Event) {
      const ev = e as CustomEvent<{
        originalId: string;
        alternative: NonNullable<Part["replacement"]>;
      }>;
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
    () => {
      const part = localParts.find((p) => p.id === selectedId) ?? null;
      if (!part) return null;
      if (!part.replacement) return part;
      return {
        ...part,
        name: part.replacement.name,
        partNumber: part.replacement.partNumber ?? part.partNumber,
        links: part.replacement.links?.length ? part.replacement.links : part.links,
      };
    },
    [localParts, selectedId]
  );

  return (
    <div className="relative min-h-screen bg-[#e6e6e6] text-black flex">
      {/* Sidebar */}
      <BikeSelectorSidebar bikes={allBikes} currentBikeId={bike.id} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
              meshMappings={meshMappings}
              selectedPartId={selectedId}
              onSelectPart={setSelectedId}
            />
          ) : (
            <BikeCanvas
              diagram={diagram}
              hotspots={hotspots}
              selectedPartId={selectedId}
              onSelectPart={setSelectedId}
            />
          )}
        </Suspense>

        <PartDrawer part={selectedPart} onClose={() => setSelectedId(null)} />

        {/* Index Overlay - always rendered at this level */}
        <div
          className={["fixed top-0 right-0 h-full w-64 md:w-72 z-50 bg-white border-l border-black/10 shadow-2xl transition-transform duration-200",
            indexOpen
              ? "translate-x-0 opacity-100 pointer-events-auto"
              : "translate-x-full opacity-0 pointer-events-none",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-black/10">
              <div className="text-xs uppercase tracking-[0.3em] text-black/60">Index</div>
              <button
                type="button"
                className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black/70 hover:border-black/40"
                onClick={() => setIndexOpen(false)}
              >
                Close
              </button>
            </div>

            {/* Bike List at top, same format as sidebar */}
            <div className="p-4 border-b border-black/10 overflow-y-auto max-h-[180px]">
              <div className="text-xs uppercase tracking-[0.3em] text-black/60 mb-2">Assembly Programs</div>
              {allBikes.length > 0 ? (
                <ul className="space-y-1">
                  {allBikes.map((b) => (
                    <li key={b.id}>
                      <a
                        href={`/bike/${b.id}`}
                        className={["block px-3 py-1 rounded-md text-sm",
                          b.id === bike.id
                            ? "bg-black/5 border border-black/20 text-black font-semibold"
                            : "text-black/70 hover:text-black hover:bg-black/[0.02]",
                        ].join(" ")}
                      >
                        {b.year ? `${b.year} ` : ""}{b.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-black/30 text-xs">No bikes found.</div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <button
                  type="button"
                  className="w-full rounded-md border border-black/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-black/70 hover:border-black/40"
                  onClick={() => {
                    setIndexOpen(false);
                    setIndexBreakawayOpen(true);
                  }}
                >
                  Open Full Parts Index
                </button>
              </div>
              <div className="text-2xl font-semibold tracking-tight mb-1">{bike.name}</div>
              <div className="text-black/60 mb-4">
                {bike.year ? `${bike.year} • ` : ""}
                {bike.manufacturer ?? "Manufacturer"}
              </div>
              <div className="text-sm uppercase tracking-[0.2em] text-black/50 mb-2">Controlled Parts Index</div>
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

        {/* Breakaway full index */}
        {indexBreakawayOpen ? (
          <div
            className="fixed inset-0 z-[60] bg-black/30 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto h-full w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-black/10 overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.3em] text-black/60">Full Parts Index</div>
                <button
                  type="button"
                  className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black/70 hover:border-black/40"
                  onClick={() => setIndexBreakawayOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="h-[calc(100%-56px)] overflow-y-auto p-4 sm:p-6">
                <div className="text-2xl font-semibold tracking-tight mb-1">{bike.name}</div>
                <div className="text-black/60 mb-4">
                  {bike.year ? `${bike.year} • ` : ""}
                  {bike.manufacturer ?? "Manufacturer"}
                </div>
                <div className="text-sm uppercase tracking-[0.2em] text-black/50 mb-2">Controlled Parts Index</div>
                <CategorizedPartsList
                  parts={localParts}
                  selectedId={selectedId}
                  selectedPart={selectedPart}
                  onSelectPart={setSelectedId}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
