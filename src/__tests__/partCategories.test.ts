import { describe, it, expect } from "vitest";
import { categorizePartsByName, categoryOrder } from "@/lib/partCategories";
import type { Part } from "@/lib/types";

describe("Part Categorization", () => {
  it("should categorize handlebar parts into Control & Handling", () => {
    const parts: Part[] = [
      {
        id: "handlebar-1",
        name: "Handlebar - Main",
        partNumber: "HB-001",
      },
    ];

    const categorized = categorizePartsByName(parts);
    expect(categorized["Control & Handling"]).toHaveLength(1);
    expect(categorized["Control & Handling"][0].id).toBe("handlebar-1");
  });

  it("should categorize wheel and brake parts", () => {
    const parts: Part[] = [
      { id: "wheel-1", name: "Front Wheel", partNumber: "FW-001" },
      { id: "brake-1", name: "Brake Disc", partNumber: "BR-001" },
      { id: "tire-1", name: "Front Tire", partNumber: "TR-001" },
    ];

    const categorized = categorizePartsByName(parts);
    expect(categorized["Wheel & Brake"]).toHaveLength(3);
  });

  it("should categorize frame and body parts", () => {
    const parts: Part[] = [
      { id: "tank-1", name: "Fuel Tank", partNumber: "TK-001" },
      { id: "seat-1", name: "Seat", partNumber: "ST-001" },
    ];

    const categorized = categorizePartsByName(parts);
    expect(categorized["Frame & Body"]).toHaveLength(2);
  });

  it("should categorize engine and drive parts", () => {
    const parts: Part[] = [
      { id: "exhaust-1", name: "Exhaust Pipe", partNumber: "EX-001" },
      { id: "chain-1", name: "Chain Drive", partNumber: "CH-001" },
      { id: "filter-1", name: "Oil Filter", partNumber: "OL-001" },
    ];

    const categorized = categorizePartsByName(parts);
    expect(categorized["Engine & Drive"]).toHaveLength(3);
  });

  it("should place unknown parts in Other category", () => {
    const parts: Part[] = [
      { id: "unknown-1", name: "Custom Part XYZ", partNumber: "CX-001" },
    ];

    const categorized = categorizePartsByName(parts);
    expect(categorized.Other).toHaveLength(1);
  });

  it("should maintain category order", () => {
    expect(categoryOrder[0]).toBe("Control & Handling");
    expect(categoryOrder[1]).toBe("Wheel & Brake");
    expect(categoryOrder[2]).toBe("Frame & Body");
    expect(categoryOrder[3]).toBe("Engine & Drive");
    expect(categoryOrder[4]).toBe("Other");
  });
});
