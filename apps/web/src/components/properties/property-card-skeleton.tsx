export function PropertyCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
    >
      <div className="aspect-[4/3] bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-5 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-4/5 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-2 h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
