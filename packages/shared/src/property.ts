import type { Currency, OperationType, PropertyType } from "./enums";

/** Public data shown in catalog cards. */
export type PropertySummary = {
  id: string;
  title: string;
  operationType: OperationType;
  propertyType: PropertyType;
  price: number;
  currency: Currency;
  usableArea: number | null;
  totalArea: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  commune: string;
  city: string;
  region: string;
  isFeatured: boolean;
  mainImageUrl: string | null;
  createdAt: string;
};

export type PropertyImageDetail = {
  id: string;
  url: string;
  position: number;
  isMain: boolean;
};

/** Public data shown in the property detail page. */
export type PropertyDetail = Omit<PropertySummary, "mainImageUrl"> & {
  description: string;
  parkingSpaces: number | null;
  ageInYears: number | null;
  address: string;
  features: string[];
  images: PropertyImageDetail[];
  updatedAt: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<Item> = {
  data: Item[];
  meta: PaginationMeta;
};
