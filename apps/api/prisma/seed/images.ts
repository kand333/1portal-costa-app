import type { PropertyType } from "../../src/generated/prisma/enums";
import { SEED_PLACEHOLDER_PUBLIC_ID_PREFIX } from "../../src/lib/seed-placeholder";
import type { SeedProperty } from "./data";

// Development placeholder images: public Unsplash photos, not in Cloudinary (see the prefix).
export { SEED_PLACEHOLDER_PUBLIC_ID_PREFIX };

export type SeedImage = {
  url: string;
  publicId: string;
  position: number;
  isMain: boolean;
};

// Unsplash photo ids, grouped by what each photo shows (reviewed manually).
const houseExteriorPhotos = [
  "1564013799919-ab600027ffc6",
  "1568605114967-8130f3a36994",
  "1570129477492-45c003edd2be",
  "1512917774080-9991f1c4c750",
  "1600596542815-ffad4c1539a9",
  "1600585154340-be6161a56a0c",
  "1449844908441-8829872d2607",
  "1600566753190-17f0baa2a6c3",
];
const homeInteriorPhotos = [
  "1600607687939-ce8a6c25118c",
  "1560448204-e02f11c3d0e2",
  "1484154218962-a197022b5858",
  "1522708323590-d24dbb6b0267",
  "1502672260266-1c1ef2d93688",
  "1493809842364-78817add7ffb",
  "1505691938895-1758d7feb511",
  "1586023492125-27b2c045efd7",
  "1501183638710-841dd1904471",
];
const officePhotos = ["1497366811353-6870744d04b2", "1497366216548-37526070297c", "1497215842964-222b430dc094"];
const landPhotos = ["1500382017468-9049fed747ef", "1441974231531-c6227db76b6e"];
const commercialPhotos = ["1441986300917-64674bd600d8"];

const photoUrl = (photoId: string) =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1600&q=80`;

/** Returns `count` consecutive photos from `pool`, starting at `offset` (wrapping around). */
const rotate = (pool: string[], offset: number, count: number) =>
  Array.from({ length: Math.min(count, pool.length) }, (_, index) => pool[(offset + index) % pool.length]);

function pickPhotos(propertyType: PropertyType, sequence: number): string[] {
  switch (propertyType) {
    case "HOUSE":
      return [...rotate(houseExteriorPhotos, sequence, 1), ...rotate(homeInteriorPhotos, sequence, 2)];
    case "APARTMENT":
      return rotate(homeInteriorPhotos, sequence, 3);
    case "OFFICE":
      return rotate(officePhotos, sequence, 3);
    case "LAND":
      return rotate(landPhotos, sequence, 2);
    case "COMMERCIAL":
      return [...commercialPhotos, ...rotate(officePhotos, sequence, 1)];
    case "OTHER":
      return rotate(homeInteriorPhotos, sequence, 1);
  }
}

/** Placeholder gallery for a seed property; drafts get none (they "lack photos"). */
export function getSeedImages(property: SeedProperty): SeedImage[] {
  if (!property.isPublished) return [];

  const sequence = Number.parseInt(property.id.slice(-12), 10);
  return pickPhotos(property.propertyType, sequence).map((photoId, position) => ({
    url: photoUrl(photoId),
    publicId: `${SEED_PLACEHOLDER_PUBLIC_ID_PREFIX}${sequence}-${position}`,
    position,
    isMain: position === 0,
  }));
}
