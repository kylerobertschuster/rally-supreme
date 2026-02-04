import fs from "fs";
import path from "path";

export function loadBike(slug: string) {
  const base = path.join(process.cwd(), "data/bikes", slug);

  const read = (p: string) => JSON.parse(fs.readFileSync(path.join(base, p), "utf-8"));

  return {
    bike: read("bike.json"),
    diagram: read("diagram.json"),
    parts: read("parts.json"),
    hotspots: read("hotspots.json")
  };
}
