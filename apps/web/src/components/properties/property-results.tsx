import type { PaginatedResponse, PropertySummary } from "@portal/shared/property";
import { PropertyGrid, PropertyGridSkeleton, type PropertyGridLayout } from "./property-grid";

type PropertyResultsProps = {
  data: PaginatedResponse<PropertySummary> | undefined;
  error: Error | undefined;
  isLoading: boolean;
  onRetry: () => void;
  /** Number of placeholder cards shown while loading. */
  skeletonCount: number;
  loadingLabel: string;
  emptyMessage: string;
  layout?: PropertyGridLayout;
};

/** Loading, error, empty and results states of a list of properties. */
export function PropertyResults({
  data,
  error,
  isLoading,
  onRetry,
  skeletonCount,
  loadingLabel,
  emptyMessage,
  layout = "full",
}: PropertyResultsProps) {
  if (isLoading) {
    return <PropertyGridSkeleton count={skeletonCount} label={loadingLabel} layout={layout} />;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-[1.25rem] border border-red-300/60 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200"
      >
        <p>No pudimos cargar las propiedades. {error.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 h-11 rounded-full bg-red-800 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-900"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (data && data.data.length === 0) {
    return (
      <p className="rounded-[1.25rem] border border-dashed border-line p-12 text-center text-muted">
        {emptyMessage}
      </p>
    );
  }

  return data ? <PropertyGrid properties={data.data} layout={layout} /> : null;
}
