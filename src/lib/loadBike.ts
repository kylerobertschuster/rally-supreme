import fs from "fs";
import path from "path";
import type { Bike, Diagram, Hotspot, MeshPartMappings, Part } from "./types";

export class BikeNotFoundError extends Error {
  constructor(slug: string) {
    super(`Bike "${slug}" not found`);
    this.name = "BikeNotFoundError";
  }
}

export function loadBike(slug: string) {
  const base = path.join(process.cwd(), "data/bikes", slug);

  // Validate bike directory exists
  if (!fs.existsSync(base)) {
    throw new BikeNotFoundError(slug);
  }

  const read = (p: string) => {
    const filePath = path.join(base, p);
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (error) {
      throw new Error(
        `Failed to read ${p} for bike "${slug}": ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const readOptional = <T>(p: string, fallback: T): T => {
    const filePath = path.join(base, p);
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
    } catch (error) {
      console.warn(
        `Warning: Failed to read ${p} for bike "${slug}", using fallback:`,
        error
      );
      return fallback;
    }
  };

  return {
    bike: readOptional<Bike>("bike.json", { id: slug, name: slug }),
    diagram: read("diagram.json") as Diagram,
    parts: readOptional<Part[]>("parts.json", []),
    hotspots: readOptional<Hotspot[]>("hotspots.json", []),
    meshMappings: readOptional<MeshPartMappings>("mesh-map.json", {}),
  };
}
