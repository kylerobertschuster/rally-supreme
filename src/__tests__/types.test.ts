import { describe, it, expect } from "vitest";
import type { Bike, Part, Diagram } from "@/lib/types";

describe("Types", () => {
  it("should create a valid Bike object", () => {
    const bike: Bike = {
      id: "ktm-500-exc-f",
      name: "EXC-F 500",
      year: "2025",
      manufacturer: "KTM",
    };

    expect(bike.id).toBe("ktm-500-exc-f");
    expect(bike.name).toBe("EXC-F 500");
    expect(bike.year).toBe("2025");
  });

  it("should create a valid Part object", () => {
    const part: Part = {
      id: "exhaust-system",
      name: "Exhaust System",
      partNumber: "EXC-500-EXHAUST-001",
      tags: ["performance", "heat-management"],
      notes: "OEM specification exhaust",
      links: [
        {
          label: "View Specs",
          url: "https://example.com/specs",
        },
      ],
    };

    expect(part.name).toBe("Exhaust System");
    expect(part.tags).toContain("performance");
    expect(part.links).toHaveLength(1);
  });

  it("should create a valid Diagram object", () => {
    const diagram: Diagram = {
      id: "main-diagram",
      label: "Main Components",
      viewer: "three",
      modelUrl: "/bikes/ktm-500-exc-f/model.glb",
    };

    expect(diagram.viewer).toBe("three");
    expect(diagram.modelUrl).toContain("ktm-500-exc-f");
  });
});
