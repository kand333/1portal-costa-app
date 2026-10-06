import type { Currency, OperationType, PropertyType, UserRole } from "../../src/generated/prisma/enums";
import snapshotJson from "./snapshot.json";

/**
 * Development data: a snapshot of a real database (catalog, users and activity), exported by
 * `export-snapshot.ts`. Dates are ISO strings and decimals strings, as JSON keeps them.
 * Users carry no password: the seed gives them all TEST_USER_PASSWORD.
 */
export type SnapshotFeature = { id: string; name: string; createdAt: string };

export type SnapshotUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type SnapshotProperty = {
  id: string;
  title: string;
  description: string;
  operationType: OperationType;
  propertyType: PropertyType;
  price: string;
  currency: Currency;
  usableArea: string | null;
  totalArea: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  ageInYears: number | null;
  address: string;
  commune: string;
  city: string;
  region: string;
  isPublished: boolean;
  isFeatured: boolean;
  deletedAt: string | null;
  createdAt: string;
  featureIds: string[];
};

export type SnapshotImage = {
  id: string;
  propertyId: string;
  url: string;
  publicId: string;
  position: number;
  isMain: boolean;
  createdAt: string;
};

export type SnapshotFavorite = { userId: string; propertyId: string; createdAt: string };

export type SnapshotInquiry = {
  id: string;
  propertyId: string | null;
  propertyTitle: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  hiddenByUser: boolean;
  createdAt: string;
  lastActivityAt: string;
};

export type SnapshotMessage = {
  id: string;
  inquiryId: string;
  authorId: string | null;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
};

export type SeedSnapshot = {
  exportedAt: string;
  features: SnapshotFeature[];
  users: SnapshotUser[];
  properties: SnapshotProperty[];
  images: SnapshotImage[];
  favorites: SnapshotFavorite[];
  inquiries: SnapshotInquiry[];
  messages: SnapshotMessage[];
};

// JSON widens the enum values to string; export-snapshot.ts writes them from the database.
export const seedSnapshot = snapshotJson as unknown as SeedSnapshot;
