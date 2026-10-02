import type { PropertySummary } from "@portal/shared/property";
import { PropertyCard } from "./property-card";
import { PropertyCardSkeleton } from "./property-card-skeleton";

/**
 * - `full`: the grid uses the whole page width: 1 column on phones, 2 on tablets, 3 on desktop.
 * - `withSidebar`: next to a sidebar (catalog filters), so the third column waits for wide screens.
 */
export type PropertyGridLayout = "full" | "withSidebar";

const gridClassNames: Record<PropertyGridLayout, string> = {
  full: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
  withSidebar: "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3",
};

type PropertyGridProps = {
  properties: PropertySummary[];
  layout?: PropertyGridLayout;
};

export function PropertyGrid({ properties, layout = "full" }: PropertyGridProps) {
  return (
    <ul className={gridClassNames[layout]}>
      {properties.map((property) => (
        <li key={property.id}>
          <PropertyCard property={property} />
        </li>
      ))}
    </ul>
  );
}

type PropertyGridSkeletonProps = {
  count: number;
  /** Announced to assistive technology while the grid loads. */
  label: string;
  layout?: PropertyGridLayout;
};

export function PropertyGridSkeleton({ count, label, layout = "full" }: PropertyGridSkeletonProps) {
  return (
    <div role="status" aria-label={label} className={gridClassNames[layout]}>
      {Array.from({ length: count }, (_, index) => (
        <PropertyCardSkeleton key={index} />
      ))}
    </div>
  );
}
