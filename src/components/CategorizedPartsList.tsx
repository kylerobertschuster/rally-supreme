"use client";

import { useEffect, useRef } from "react";
import type { Part } from "@/lib/types";
import {
  categorizePartsByName,
  categoryOrder,
  getCategoryEmoji,
} from "@/lib/partCategories";

export function CategorizedPartsList({
  parts,
  selectedId,
  onSelectPart,
  selectedPart,
}: {
  parts: Part[];
  selectedId: string | null;
  onSelectPart: (id: string) => void;
  selectedPart?: Part | null;
}) {
  const categorized = categorizePartsByName(parts);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);

  // Scroll selected part into view
  useEffect(() => {
    if (selectedButtonRef.current) {
      selectedButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedId]);

  return (
    <div className="mt-3 max-h-[70vh] space-y-6 overflow-y-auto pr-2 text-base text-black/80">
      {/* Show replacements/alternatives for selected part */}
      {selectedId && selectedPart && selectedPart.alternatives?.length ? (
        <div className="space-y-2 border-b-2 border-black/10 pb-4">
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-lg">⭐</span>
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-black/70">
              Compatible Options
            </h3>
          </div>
          <div className="space-y-1 border-l-2 border-black/10 pl-4">
            {selectedPart.alternatives.map((alt) => (
              <button
                key={alt.id}
                onClick={() => {
                  const ev = new CustomEvent("part:replace", {
                    detail: { originalId: selectedPart.id, alternative: alt },
                  });
                  window.dispatchEvent(ev);
                }}
                className="w-full text-left transition px-3 py-2 rounded-md text-black/70 hover:text-black hover:bg-black/[0.02] text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm">{alt.name}</div>
                    {alt.partNumber && (
                      <div className="text-xs text-black/40">{alt.partNumber}</div>
                    )}
                  </div>
                  {alt.links?.length ? (
                    <span className="text-xs text-black/40 whitespace-nowrap">
                      {alt.links.length} link{alt.links.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-black/30">No links</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* All categorized parts */}
      {categoryOrder.map((category) => {
        const categoryParts = categorized[category];
        if (categoryParts.length === 0) return null;

        return (
          <div key={category} className="space-y-2">
            {/* Category Header */}
            <div className="flex items-center gap-2 px-2 py-1">
              <span className="text-lg">{getCategoryEmoji(category)}</span>
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-black/70">
                {category}
              </h3>
              <div className="ml-auto text-xs text-black/40">
                {categoryParts.length} item{categoryParts.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Parts in Category */}
            <div className="space-y-1 border-l-2 border-black/10 pl-4">
              {categoryParts.map((part, idx) => {
                const selected = selectedId === part.id;
                return (
                  <button
                    key={part.id}
                    ref={selected ? selectedButtonRef : null}
                    onClick={() => onSelectPart(part.id)}
                    className={[
                      "w-full text-left transition px-3 py-2 rounded-md",
                      selected
                        ? "bg-black/5 border border-black/20 text-black font-semibold"
                        : "text-black/70 hover:text-black hover:bg-black/[0.02]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm">{part.name}</div>
                        {part.partNumber && (
                          <div className="text-xs text-black/40">
                            {part.partNumber}
                          </div>
                        )}
                      </div>
                      {part.links?.length ? (
                        <span className="text-xs text-black/40 whitespace-nowrap">
                          {part.links.length} link{part.links.length !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-black/30">No links</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
