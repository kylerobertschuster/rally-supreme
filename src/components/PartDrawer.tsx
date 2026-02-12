"use client";

import React, { useEffect, useRef } from "react";
import type { Part } from "@/lib/types";

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [] as HTMLElement[];
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ];
  return Array.from(container.querySelectorAll(selectors.join(","))) as HTMLElement[];
}

export function PartDrawer({
  part,
  onClose,
}: {
  part: Part | null;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!part || !container) return;

    // save focus and move focus into the dialog
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const focusable = getFocusableElements(container);
    const first = focusable[0] ?? container;
    (first as HTMLElement).focus?.();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        // trap focus
        const focusables = getFocusableElements(container);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      // restore previous focus
      previouslyFocused.current?.focus?.();
    };
  }, [part, onClose]);

  return (
    <div
      ref={containerRef}
      className={[
        "fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white text-black",
        "backdrop-blur border-l border-black/10 shadow-2xl",
        "transition-transform duration-200",
        part ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-labelledby={part ? "part-drawer-title" : undefined}
      tabIndex={-1}
    >
      <div className="p-4 flex items-center justify-between border-b border-black/10">
        <div id="part-drawer-title" className="font-semibold tracking-tight">
          {part ? part.name : "Part Details"}
        </div>
        <button
          onClick={onClose}
          aria-label="Close part details"
          className="px-3 py-1 rounded-md border border-black/20 text-xs uppercase tracking-[0.2em] hover:border-black/40"
        >
          Close
        </button>
      </div>

      <div className="p-4 space-y-3">
        {!part ? (
          <div className="text-black/50">No part selected.</div>
        ) : (
          <>
            <div className="text-xl font-semibold leading-tight">{part.name}</div>

            {part.partNumber && (
              <div className="text-black/60">
                Part #: <span className="text-black">{part.partNumber}</span>
              </div>
            )}

            {part.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {part.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-1 rounded-full bg-black/5 border border-black/10"
                  >
                    {t.toUpperCase()}
                  </span>
                ))}
              </div>
            ) : null}

            {part.notes && (
              <div className="text-black/70 leading-relaxed">{part.notes}</div>
            )}

            {part.links?.length ? (
              <div className="pt-2 space-y-2">
                <div className="text-sm font-semibold text-black/60">Links</div>
                {part.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm underline text-black/80 hover:text-black"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            ) : null}

            {/* Alternatives / Replacements */}
            {part.alternatives && part.alternatives.length ? (
              <div className="pt-4">
                <div className="text-sm font-semibold text-black/60 mb-2">Replacement Options</div>
                <div className="space-y-2">
                  {part.alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="flex items-center justify-between gap-3 border border-black/5 p-2 rounded"
                    >
                      <div className="text-sm">{alt.name}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // dispatch a custom event so parent can handle replacement
                            const ev = new CustomEvent("part:replace", {
                              detail: { originalId: part.id, alternative: alt },
                            });
                            window.dispatchEvent(ev);
                          }}
                          className="px-3 py-1 rounded-md border border-black/20 text-xs uppercase tracking-[0.2em] hover:border-black/40"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
