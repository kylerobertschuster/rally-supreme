import BikeClient from "./ui";
import { loadBike } from "@/lib/loadBike";

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { diagram, parts, hotspots } = loadBike(slug);

  return (
    <BikeClient
      diagram={diagram}
      parts={parts}
      hotspots={hotspots}
    />
  );
}
