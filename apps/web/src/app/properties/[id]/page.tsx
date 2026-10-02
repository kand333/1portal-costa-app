import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PropertyDetail } from "@/components/property-detail/property-detail";
import { fetchPropertyDetail } from "@/lib/property-detail-api";

// One API request per render, shared by the metadata and the page.
const getProperty = cache(fetchPropertyDetail);

export async function generateMetadata({ params }: PageProps<"/properties/[id]">): Promise<Metadata> {
  const property = await getProperty((await params).id);
  if (!property) return { title: "Propiedad no encontrada | Portal Inmobiliario" };
  return {
    title: `${property.title} | Portal Inmobiliario`,
    description: property.description.slice(0, 160),
  };
}

export default async function PropertyDetailPage({ params }: PageProps<"/properties/[id]">) {
  const property = await getProperty((await params).id);
  if (!property) notFound();
  return <PropertyDetail property={property} />;
}
