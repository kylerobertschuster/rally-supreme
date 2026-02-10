import type { NextRequest } from "next/server";
import { loadBike, BikeNotFoundError } from "@/lib/loadBike";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { parts, bike } = loadBike(slug);

    return Response.json({
      bikeId: bike.id,
      parts,
      count: parts.length,
    });
  } catch (error) {
    if (error instanceof BikeNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    console.error("Error loading bike parts:", error);
    return Response.json(
      { error: "Failed to load bike parts" },
      { status: 500 }
    );
  }
}
