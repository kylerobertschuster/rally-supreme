"use client";

import type { Part } from "@/lib/types";

export function PartDrawer({
  part,
  onClose
}: {
  part: Part | null;
  onClose: () => void;
}) {
  return (
    <div
      className={[
        "fixed top-0 right-0 h-full w-full sm:w-[420px] bg-black/90 text-white",
        "backdrop-blur border-l border-white/10 shadow-2xl",
        "transition-transform duration-200",
        part ? "translate-x-0" : "translate-x-full"
      ].join(" ")}
      role="dialog"
      aria-modal="true"
    >
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <div className="font-semibold tracking-tight">PART DETAILS</div>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20"
        >
          CLOSE
        </button>
      </div>

      <div className="p-4 space-y-3">
        {!part ? (
          <div className="text-white/70">NO PART SELECTED.</div>
        ) : (
          <>
            <div className="text-xl font-bold leading-tight">{part.name}</div>

            {part.partNumber && (
              <div className="text-white/70">
                PART #: <span className="text-white">{part.partNumber}</span>
              </div>
            )}

            {part.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {part.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10"
                  >
                    {t.toUpperCase()}
                  </span>
                ))}
              </div>
            ) : null}

            {part.notes && (
              <div className="text-white/80 leading-relaxed">{part.notes}</div>
            )}

            {part.links?.length ? (
              <div className="pt-2 space-y-2">
                <div className="text-sm font-semibold text-white/80">LINKS</div>
                {part.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm underline text-white/90 hover:text-white"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
