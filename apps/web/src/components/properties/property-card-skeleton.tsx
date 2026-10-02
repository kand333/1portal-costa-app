export function PropertyCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-col overflow-hidden rounded-[1.25rem] border border-line/70 bg-surface"
    >
      <div className="aspect-[5/4] bg-line/60" />
      <div className="flex flex-col gap-2.5 p-6">
        <div className="h-7 w-1/3 rounded-full bg-line/60" />
        <div className="h-4 w-4/5 rounded-full bg-line/60" />
        <div className="h-4 w-1/2 rounded-full bg-line/60" />
        <div className="mt-3 h-4 w-3/4 rounded-full bg-line/60" />
      </div>
    </div>
  );
}
