import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PropertyDetail } from "@/components/property-detail/property-detail";
import { geocodeAddress } from "@/lib/geocoding";
import { fetchPropertyDetail } from "@/lib/property-detail-api";
import { buildPropertyMetadata, SITE_NAME } from "@/lib/property-metadata";

// One API request per render, shared by the metadata and the page.
const getProperty = cache(fetchPropertyDetail);

export async function generateMetadata({ params }: PageProps<"/properties/[id]">): Promise<Metadata> {
  const property = await getProperty((await params).id);
  // notFound() already adds "noindex".
  if (!property) return { title: `Propiedad no encontrada | ${SITE_NAME}` };
  return buildPropertyMetadata(property);
}

export default async function PropertyDetailPage({ params }: PageProps<"/properties/[id]">) {
  const property = await getProperty((await params).id);
  if (!property) notFound();
  const mapLocation = await geocodeAddress(property);
  return <PropertyDetail property={property} mapLocation={mapLocation} />;
}
