type ValuationProgressProps = {
  /** Fields already answered with a valid value. */
  done: number;
  total: number;
};

/** How far along the form is: a bar that fills as each field gets a valid answer (sticky under the header on phones). */
export function ValuationProgress({ done, total }: ValuationProgressProps) {
  const share = total > 0 ? Math.min(1, done / total) : 0;
  const isComplete = done >= total;

  return (
    <div className="z-20 -mx-1 mb-4 rounded-2xl bg-paper/90 px-1 py-2 backdrop-blur max-lg:sticky max-lg:top-[5.5rem]">
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className={`font-semibold ${isComplete ? "text-brass-text" : "text-ink"}`}>
          {isComplete ? "Todo listo" : "Avance"}
        </span>
        <span className="tabular-nums text-muted">
          {done} de {total} datos
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Avance del formulario"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="h-2.5 overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full origin-left rounded-full bg-gradient-to-r from-accent via-accent to-brand-blue transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${share})` }}
        />
      </div>
    </div>
  );
}
