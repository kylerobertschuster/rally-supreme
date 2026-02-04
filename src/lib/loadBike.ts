import fs from "fs";
import path from "path";

export function loadBike(slug: string) {
  const base = path.join(process.cwd(), "data/bikes", slug);

  const read = (p: string) =>
    JSON.parse(fs.readFileSync(path.join(base, p), "utf-8"));
  const readOptional = <T>(p: string, fallback: T) => {
    try {
      return read(p) as T;
    } catch {
      return fallback;
    }
  };

  return {
    bike: readOptional("bike.json", { id: slug, name: slug }),
    diagram: read("diagram.json"),
    parts: readOptional("parts.json", []),
    hotspots: readOptional("hotspots.json", [])
  };
}
