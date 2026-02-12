import type { NextRequest } from "next/server";
import { loadBike, BikeNotFoundError } from "@/lib/loadBike";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { bike, diagram, parts, hotspots, meshMappings } = loadBike(slug);

    return Response.json({
      bike,
      diagram,
      parts,
      hotspots,
      meshMappings,
    });
  } catch (error) {
    if (error instanceof BikeNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    console.error("Error loading bike:", error);
    return Response.json(
      { error: "Failed to load bike data" },
      { status: 500 }
    );
  }
}
