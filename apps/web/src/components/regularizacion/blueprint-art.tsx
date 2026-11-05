import type { CSSProperties } from "react";

const order = (value: number) => ({ "--order": value }) as CSSProperties;

/** A house plan that draws itself on load; one dashed piece is missing and clicks into place at the end. */
export function BlueprintArt() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 320"
      className="mx-auto h-auto w-full max-w-md text-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 290H380" className="blueprint-line text-line" pathLength={1} />
      <path d="M60 290V150L200 50L340 150V290" className="blueprint-line" pathLength={1} style={order(1)} />
      <path d="M40 160L200 40L360 160" className="blueprint-line text-brass" pathLength={1} style={order(2)} />
      <path d="M100 290V210H160V290" className="blueprint-line" pathLength={1} style={order(3)} />
      <path d="M230 190H300V250H230Z" className="blueprint-line" pathLength={1} style={order(4)} />
      <path d="M265 190V250M230 220H300" className="blueprint-line text-muted" pathLength={1} style={order(5)} />
      {/* The missing piece: a dashed outline that snaps into the wall. */}
      <g className="piece-snap text-accent">
        <path d="M300 150H340V190H300Z" strokeDasharray="6 8" />
        <path d="M312 170H328M320 162V178" />
      </g>
    </svg>
  );
}
