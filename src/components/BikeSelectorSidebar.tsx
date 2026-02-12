"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Bike } from "@/lib/types";

function groupBikesByYearAndMfg(bikes: Bike[]) {
  const grouped: Record<string, Record<string, Bike[]>> = {};

  bikes.forEach((bike) => {
    const year = bike.year || "Unknown";
    const mfg = bike.manufacturer || "Unknown";

    if (!grouped[year]) {
      grouped[year] = {};
    }
    if (!grouped[year][mfg]) {
      grouped[year][mfg] = [];
    }

    grouped[year][mfg].push(bike);
  });

  // Sort by year descending
  const sortedYears = Object.keys(grouped).sort((a, b) => {
    const aYear = parseInt(a, 10);
    const bYear = parseInt(b, 10);
    if (isNaN(aYear)) return 1;
    if (isNaN(bYear)) return -1;
    return bYear - aYear;
  });

  return { grouped, sortedYears };
}

export function BikeSelectorSidebar({
  bikes,
  currentBikeId,
}: {
  bikes: Bike[];
  currentBikeId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { grouped, sortedYears } = useMemo(
    () => groupBikesByYearAndMfg(bikes),
    [bikes]
  );

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("click", onClickOutside);
      return () => document.removeEventListener("click", onClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-20 z-40 md:hidden px-3 py-2 rounded-md border border-black/20 bg-white text-xs uppercase tracking-[0.2em] hover:border-black/40"
        aria-label="Toggle bike selector"
      >
        ☰ Models
      </button>

      {/* Sidebar */}
      <div
        className={[
          "fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-black/10 shadow-lg",
          "overflow-y-auto transform transition-transform duration-200 z-50",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:relative md:top-0 md:shadow-none md:w-72",
        ].join(" ")}
      >
        <div className="p-4 space-y-4">
          <div className="text-xs uppercase tracking-[0.3em] text-black/60">
            Motorcycle Models
          </div>

          <div className="space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
            {sortedYears.map((year) => {
              const mfgMap = grouped[year];
              const mfgs = Object.keys(mfgMap).sort();

              return (
                <div key={year} className="space-y-3">
                  {/* Year Header */}
                  <div className="text-sm font-semibold tracking-tight text-black/70">
                    {year}
                  </div>

                  {/* Manufacturers in this year */}
                  <div className="space-y-2 border-l-2 border-black/10 pl-4">
                    {mfgs.map((mfg) => {
                      const bikeList = mfgMap[mfg];
                      return (
                        <div key={`${year}-${mfg}`} className="space-y-1">
                          {/* Manufacturer Label */}
                          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-black/50">
                            {mfg}
                          </div>

                          {/* Bikes under this mfg/year */}
                          <div className="space-y-1 pl-2 border-l border-black/5">
                            {bikeList.map((bike) => {
                              const isActive = currentBikeId === bike.id;
                              return (
                                <Link
                                  key={bike.id}
                                  href={`/bike/${bike.id}`}
                                  onClick={() => setIsOpen(false)}
                                  className={[
                                    "block text-left transition px-3 py-2 rounded-md text-sm",
                                    isActive
                                      ? "bg-black/5 border border-black/20 text-black font-semibold"
                                      : "text-black/70 hover:text-black hover:bg-black/[0.02]",
                                  ].join(" ")}
                                >
                                  {bike.name}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
