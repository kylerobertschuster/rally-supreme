"use client";

import { useMemo, useState } from "react";
import type { Diagram, Hotspot, Part } from "@/lib/types";
import { BikeCanvas } from "@/components/BikeCanvas";
import { PartDrawer } from "@/components/PartDrawer";

export default function BikeClient({
  diagram,
  parts,
  hotspots
}: {
  diagram: Diagram;
  parts: Part[];
  hotspots: Hotspot[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPart = useMemo(
    () => parts.find((p) => p.id === selectedId) ?? null,
    [parts, selectedId]
  );

  return (
    <div className="relative">
      <BikeCanvas
        diagram={diagram}
        hotspots={hotspots}
        onSelectPart={(id) => setSelectedId(id)}
      />

      <PartDrawer
        part={selectedPart}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
