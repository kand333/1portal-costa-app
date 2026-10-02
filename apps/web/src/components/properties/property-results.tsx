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
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      >
        <p>No pudimos cargar las propiedades. {error.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (data && data.data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        {emptyMessage}
      </p>
    );
  }

  return data ? <PropertyGrid properties={data.data} layout={layout} /> : null;
}
