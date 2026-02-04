import { loadBike } from "@/lib/loadBike";
import BikeClient from "./ui";

export default function Page({ params }: { params: { slug: string } }) {
  const { bike, diagram, parts, hotspots } = loadBike(params.slug);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">{bike.name}</h1>
      <BikeClient diagram={diagram} parts={parts} hotspots={hotspots} />
    </div>
  );
}
