import { Suspense } from "react";
import BikeClient from "./ui";
import { loadBike } from "@/lib/loadBike";

function BikeLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#e6e6e6]">
      <div className="text-center">
        <div className="inline-block">
          <div className="h-12 w-12 animate-spin rounded-full border 4 border-black/20 border-t-black/60"></div>
        </div>
        <p className="mt-4 text-sm text-black/60">Loading bike...</p>
      </div>
    </div>
  );
}

async function BikeContent({ slug }: { slug: string }) {
  const { bike, diagram, parts, hotspots, meshMappings } = loadBike(slug);

  return (
    <BikeClient
      bike={bike}
      diagram={diagram}
      parts={parts}
      hotspots={hotspots}
      meshMappings={meshMappings}
    />
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<BikeLoading />}>
      <BikeContent slug={slug} />
    </Suspense>
  );
}
