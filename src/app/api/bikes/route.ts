import fs from "fs";
import path from "path";
import type { Bike } from "@/lib/types";

export async function GET() {
  try {
    const bikesDir = path.join(process.cwd(), "data/bikes");

    if (!fs.existsSync(bikesDir)) {
      return Response.json({ bikes: [] });
    }

    const bikeSlugs = fs.readdirSync(bikesDir);
    const bikes: Bike[] = [];

    for (const slug of bikeSlugs) {
      const bikeJsonPath = path.join(bikesDir, slug, "bike.json");
      if (fs.existsSync(bikeJsonPath)) {
        try {
          const bikeData = JSON.parse(
            fs.readFileSync(bikeJsonPath, "utf-8")
          ) as Bike;
          bikes.push(bikeData);
        } catch {
          console.warn(`Failed to parse bike.json for ${slug}`);
        }
      }
    }

    return Response.json({ bikes });
  } catch (error) {
    console.error("Error listing bikes:", error);
    return Response.json({ error: "Failed to list bikes" }, { status: 500 });
  }
}
