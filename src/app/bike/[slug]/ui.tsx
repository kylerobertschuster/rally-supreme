"use client";

import { useMemo, useState } from "react";
import type { Bike, Diagram, Hotspot, Part } from "@/lib/types";
import { BikeCanvas } from "@/components/BikeCanvas";
import { PartDrawer } from "@/components/PartDrawer";

export default function BikeClient({
  bike,
  diagram,
  parts,
  hotspots
}: {
  bike: Bike;
  diagram: Diagram;
  parts: Part[];
  hotspots: Hotspot[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    parts[0]?.id ?? null
  );

  const selectedPart = useMemo(
    () => parts.find((p) => p.id === selectedId) ?? null,
    [parts, selectedId]
  );

  return (
    <div className="relative space-y-6">
      <header className="rounded-3xl border border-black/10 bg-[radial-gradient(circle_at_10%_20%,#f59e0b,transparent_45%),radial-gradient(circle_at_90%_10%,#f97316,transparent_35%),linear-gradient(135deg,#0a0a0a,#1f1f1f_55%,#111827)] text-white p-6 md:p-8 shadow-2xl">
        <div className="text-sm uppercase tracking-[0.3em] text-white/70">
          Exploded Parts Canvas
        </div>
        <div className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
          {bike.name}
        </div>
        <div className="mt-1 text-white/80">
          {bike.year ? `${bike.year} • ` : ""}
          {bike.manufacturer ?? "Manufacturer"}
        </div>
        <div className="mt-4 text-white/80 max-w-2xl">
          Zoom, pan, and tap a component to reveal part details. This view
          turns a complex diagram into an interactive catalog.
        </div>
        <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em]">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
            Interactive Diagram
          </span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
            Fast Part Lookup
          </span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
            Dealer Ready
          </span>
        </div>
      </header>

      <BikeCanvas
        diagram={diagram}
        hotspots={hotspots}
        onSelectPart={(id) => setSelectedId(id)}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-lg">
          <div className="text-xs uppercase tracking-[0.2em] text-black/50">
            Parts Loaded
          </div>
          <div className="mt-2 text-2xl font-semibold">{parts.length}</div>
          <div className="mt-1 text-black/60">
            Curated components ready for fast lookup.
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-lg">
          <div className="text-xs uppercase tracking-[0.2em] text-black/50">
            Hotspots
          </div>
          <div className="mt-2 text-2xl font-semibold">{hotspots.length}</div>
          <div className="mt-1 text-black/60">
            Clickable zones mapped to real parts.
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-lg">
          <div className="text-xs uppercase tracking-[0.2em] text-black/50">
            Source
          </div>
          <div className="mt-2 text-2xl font-semibold">OEM</div>
          <div className="mt-1 text-black/60">
            Structured to align with catalog data.
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-xl">
        <div className="text-xs uppercase tracking-[0.2em] text-black/50">
          Parts Overview
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {parts.map((part) => (
            <button
              key={part.id}
              onClick={() => setSelectedId(part.id)}
              className={[
                "rounded-2xl border border-black/10 p-4 text-left transition",
                "hover:border-black/30 hover:shadow-md",
                selectedId === part.id
                  ? "bg-black text-white"
                  : "bg-white"
              ].join(" ")}
            >
              <div className="text-sm uppercase tracking-[0.2em] text-black/40">
                {part.partNumber ?? "PART"}
              </div>
              <div
                className={[
                  "mt-2 text-lg font-semibold",
                  selectedId === part.id ? "text-white" : "text-black"
                ].join(" ")}
              >
                {part.name}
              </div>
              {part.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {part.tags.map((t) => (
                    <span
                      key={t}
                      className={[
                        "text-xs px-2 py-1 rounded-full border",
                        selectedId === part.id
                          ? "border-white/30 text-white/90"
                          : "border-black/10 text-black/60"
                      ].join(" ")}
                    >
                      {t.toUpperCase()}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <PartDrawer
        part={selectedPart}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
