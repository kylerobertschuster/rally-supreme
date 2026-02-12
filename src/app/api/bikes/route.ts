import fs from "fs";
import path from "path";
import type { Bike } from "@/lib/types";

function collectBikeJsonFiles(baseDir: string): string[] {
  const files: string[] = [];
  const stack = [baseDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name === "bike.json") {
        files.push(fullPath);
      }
    }
  }

  return files;
}

export async function GET() {
  try {
    const bikesDir = path.join(process.cwd(), "data/bikes");

    if (!fs.existsSync(bikesDir)) {
      return Response.json({ bikes: [] });
    }

    const bikeFiles = collectBikeJsonFiles(bikesDir);
    const bikes: Bike[] = [];
    const seenIds = new Set<string>();

    for (const bikeJsonPath of bikeFiles) {
      try {
        const bikeData = JSON.parse(fs.readFileSync(bikeJsonPath, "utf-8")) as Bike;
        if (!bikeData.id || seenIds.has(bikeData.id)) continue;
        seenIds.add(bikeData.id);
        bikes.push(bikeData);
      } catch {
        console.warn(`Failed to parse bike.json at ${bikeJsonPath}`);
      }
    }

    bikes.sort((a, b) => {
      const yearA = Number.parseInt(a.year ?? "", 10);
      const yearB = Number.parseInt(b.year ?? "", 10);
      if (!Number.isNaN(yearA) && !Number.isNaN(yearB) && yearA !== yearB) {
        return yearB - yearA;
      }
      return a.name.localeCompare(b.name);
    });

    return Response.json({ bikes });
  } catch (error) {
    console.error("Error listing bikes:", error);
    return Response.json({ error: "Failed to list bikes" }, { status: 500 });
  }
}
