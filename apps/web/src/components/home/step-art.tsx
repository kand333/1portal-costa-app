import type { ReactNode } from "react";

type Vertex = readonly [number, number, number];

/** Isometric projection: (x, y, z) in grid units to SVG coordinates around the origin (ox, oy). */
function projector(ox: number, oy: number) {
  const scale = 26;
  const toPoint = ([x, y, z]: Vertex) => `${(ox + (x - y) * 0.866 * scale).toFixed(1)},${(oy + (x + y) * 0.5 * scale - z * scale).toFixed(1)}`;
  const polygon = (vertices: Vertex[]) => vertices.map(toPoint).join(" ");
  return { polygon };
}

const lineProps = {
  stroke: "var(--ink)",
  strokeOpacity: 0.55,
  strokeWidth: 1.2,
  strokeLinejoin: "round",
} as const;

type BoxProps = { polygon: (vertices: Vertex[]) => string; x: number; y: number; w: number; d: number; h: number; z?: number; fill?: string };

/** A line-drawn block: top, front-left and right faces, filled with the section ground so hidden lines stay hidden. */
function Box({ polygon, x, y, w, d, h, z = 0, fill = "var(--sand)" }: BoxProps) {
  const top = z + h;
  return (
    <g fill={fill} {...lineProps}>
      <polygon points={polygon([[x, y, top], [x + w, y, top], [x + w, y + d, top], [x, y + d, top]])} />
      <polygon points={polygon([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, top], [x, y + d, top]])} />
      <polygon points={polygon([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, top], [x + w, y, top]])} />
    </g>
  );
}

const frame = "h-auto w-full max-w-[34rem] text-ink";

/** Step 2: a house drawn in lines; the roof, with its orange panels, lifts off as the card scrolls in. */
export function IsometricHouse() {
  const { polygon } = projector(200, 190);
  const panels: ReactNode[] = [];
  for (let column = 0; column < 3; column += 1) {
    for (let row = 0; row < 2; row += 1) {
      const x0 = 0.6 + column * 1.6;
      const x1 = x0 + 1.5;
      const v0 = 0.12 + row * 0.42;
      const v1 = v0 + 0.38;
      const onSlope = (x: number, v: number): Vertex => [x, 4 - 2 * v, 3 + 2 * v];
      panels.push(
        <polygon key={`${column}-${row}`} points={polygon([onSlope(x0, v0), onSlope(x1, v0), onSlope(x1, v1), onSlope(x0, v1)])} fill="url(#house-ember)" stroke="none" />,
      );
    }
  }
  return (
    <svg viewBox="0 0 400 360" role="img" aria-label="Casa con paneles en el techo, dibujada en líneas" className={frame}>
      <defs>
        <linearGradient id="house-ember" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f56908" />
          <stop offset="1" stopColor="#ea2403" />
        </linearGradient>
      </defs>
      <Box polygon={polygon} x={-1} y={-1} z={-0.3} w={8} d={6} h={0.3} />
      <Box polygon={polygon} x={0} y={0} w={6} d={4} h={3} />
      <g fill="none" {...lineProps}>
        <polygon points={polygon([[1, 4, 1], [2.3, 4, 1], [2.3, 4, 2.2], [1, 4, 2.2]])} />
        <polygon points={polygon([[3.1, 4, 1], [4.4, 4, 1], [4.4, 4, 2.2], [3.1, 4, 2.2]])} />
        <polygon points={polygon([[6, 0.8, 0], [6, 1.9, 0], [6, 1.9, 2], [6, 0.8, 2]])} />
      </g>
      <g fill="var(--sand)" {...lineProps}>
        <polygon points={polygon([[6.4, 3.2, 0], [7, 3.2, 0], [7, 3.2, 1.2], [6.4, 3.2, 1.2]])} fill="url(#house-ember)" stroke="none" />
      </g>
      <g className="roof-lift">
        <polygon points={polygon([[0, 4, 3], [6, 4, 3], [6, 2, 5], [0, 2, 5]])} fill="var(--sand)" {...lineProps} />
        <polygon points={polygon([[6, 4, 3], [6, 0, 3], [6, 2, 5]])} fill="var(--sand)" {...lineProps} />
        {panels}
      </g>
    </svg>
  );
}

type Polygon = (vertices: Vertex[]) => string;

/** Window grids on the two visible faces of a block: the front-left face (y = y + d) and the right face (x = x + w). */
function Windows({ polygon, x, y, w, d, h, z = 0, columns, rows, side }: { polygon: Polygon; x: number; y: number; w: number; d: number; h: number; z?: number; columns: number; rows: number; side: "front" | "right" }) {
  const panes: ReactNode[] = [];
  const span = side === "front" ? w : d;
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const u0 = ((column + 0.22) / columns) * span;
      const u1 = ((column + 0.78) / columns) * span;
      const v0 = z + ((row + 0.25) / rows) * h;
      const v1 = z + ((row + 0.75) / rows) * h;
      const corners: Vertex[] =
        side === "front"
          ? [[x + u0, y + d, v0], [x + u1, y + d, v0], [x + u1, y + d, v1], [x + u0, y + d, v1]]
          : [[x + w, y + u0, v0], [x + w, y + u1, v0], [x + w, y + u1, v1], [x + w, y + u0, v1]];
      panes.push(<polygon key={`${column}-${row}`} points={polygon(corners)} />);
    }
  }
  return (
    <g fill="none" stroke="var(--ink)" strokeOpacity={0.4} strokeWidth={0.8}>
      {panes}
    </g>
  );
}

type Building =
  | { kind: "block"; x: number; y: number; w: number; d: number; h: number; columns: number; rows: number; sideColumns: number }
  | { kind: "house"; x: number; y: number; w: number; d: number; solar?: boolean };

const CITY: Building[] = [
  { kind: "block", x: 0, y: 0, w: 3, d: 2, h: 2.4, columns: 5, rows: 4, sideColumns: 3 },
  { kind: "house", x: 4.2, y: 0.2, w: 2, d: 1.6 },
  { kind: "block", x: 7.5, y: 0, w: 2, d: 2, h: 4.6, columns: 3, rows: 8, sideColumns: 3 },
  { kind: "block", x: 0, y: 3, w: 3, d: 2, h: 1.3, columns: 5, rows: 2, sideColumns: 3 },
  { kind: "house", x: 4.2, y: 3.3, w: 2, d: 1.6, solar: true },
  { kind: "block", x: 7.5, y: 3, w: 2, d: 2, h: 2.2, columns: 3, rows: 4, sideColumns: 3 },
];

const ROUTE: readonly (readonly [number, number])[] = [[-1, 2.5], [3.5, 2.5], [3.5, 5.6], [7, 5.6], [7, 2.5], [10.5, 2.5]];

/** Step 3: a district of towers, blocks and houses in lines, with an orange route that draws itself and lands on a pin. */
export function IsometricCity() {
  const { polygon } = projector(185, 85);
  const toXY = (x: number, y: number, z = 0) => polygon([[x, y, z]]).split(",").map(Number) as [number, number];
  const route = ROUTE.map(([x, y], index) => {
    const [px, py] = toXY(x, y);
    return `${index === 0 ? "M" : "L"}${px} ${py}`;
  }).join(" ");
  const [endX, endY] = toXY(...ROUTE[ROUTE.length - 1]);

  // Far items first (smaller x + y), so near ones overlap them correctly.
  const items = CITY.map((item) => {
    const centre = item.x + item.y + (item.w + item.d) / 2;
    return { item, depth: centre };
  }).sort((a, b) => a.depth - b.depth);

  return (
    <svg viewBox="0 0 460 320" role="img" aria-label="Un barrio de torres y casas dibujado en líneas, con una ruta naranja que llega a una propiedad" className={frame}>
      <Box polygon={polygon} x={-1} y={-1} z={-0.25} w={11.5} d={7.2} h={0.25} />
      <g stroke="var(--ink)" strokeOpacity={0.28} strokeWidth={1} strokeDasharray="5 6" fill="none">
        <path d={`M${toXY(-1, 2.5).join(" ")} L${toXY(10.5, 2.5).join(" ")}`} />
        <path d={`M${toXY(3.5, -1).join(" ")} L${toXY(3.5, 6.2).join(" ")}`} />
        <path d={`M${toXY(7, -1).join(" ")} L${toXY(7, 6.2).join(" ")}`} />
      </g>
      {items.map(({ item }) => {
        if (item.kind === "house") {
          const { x, y, w, d } = item;
          const top = 1;
          const ridge = 1.6;
          const onSlope = (u: number, v: number): Vertex => [x + u, y + d - (d / 2) * v, top + ridge * v];
          return (
            <g key={`h-${x}-${y}`}>
              <Box polygon={polygon} x={x} y={y} w={w} d={d} h={top} />
              <Windows polygon={polygon} x={x} y={y} w={w} d={d} h={top} columns={2} rows={1} side="front" />
              <polygon points={polygon([[x, y + d, top], [x + w, y + d, top], [x + w, y + d / 2, top + ridge], [x, y + d / 2, top + ridge]])} fill="var(--sand)" {...lineProps} />
              <polygon points={polygon([[x + w, y, top], [x + w, y + d, top], [x + w, y + d / 2, top + ridge]])} fill="var(--sand)" {...lineProps} />
              {item.solar && (
                <polygon points={polygon([onSlope(0.3, 0.2), onSlope(w - 0.3, 0.2), onSlope(w - 0.3, 0.85), onSlope(0.3, 0.85)])} fill="#f56908" stroke="none" opacity={0.9} />
              )}
            </g>
          );
        }
        return (
          <g key={`b-${item.x}-${item.y}`}>
            <Box polygon={polygon} x={item.x} y={item.y} w={item.w} d={item.d} h={item.h} />
            <Windows polygon={polygon} x={item.x} y={item.y} w={item.w} d={item.d} h={item.h} columns={item.columns} rows={item.rows} side="front" />
            <Windows polygon={polygon} x={item.x} y={item.y} w={item.w} d={item.d} h={item.h} columns={item.sideColumns} rows={item.rows} side="right" />
          </g>
        );
      })}
      <path d={route} pathLength={1} className="route-draw" fill="none" stroke="#f56908" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <g className="route-pin" fill="#f56908">
        <circle cx={endX} cy={endY} r={9} />
        <circle cx={endX} cy={endY} r={16} fill="none" stroke="#f56908" strokeWidth={2} opacity={0.5} />
      </g>
    </svg>
  );
}

/** Step 1: an orange phone with flowing waves, like the app screen in the reference. */
export function PhoneMockup() {
  return (
    <div className="phone-float relative mx-auto aspect-[9/18] w-56 overflow-hidden rounded-[2.25rem] bg-[image:var(--ember)] p-5 text-white shadow-lift sm:w-64">
      <svg aria-hidden="true" viewBox="0 0 100 200" preserveAspectRatio="none" className="absolute inset-0 size-full opacity-30">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <path key={index} d={`M-10 ${20 + index * 32} C 20 ${-5 + index * 32}, 55 ${60 + index * 32}, 110 ${25 + index * 32}`} fill="none" stroke="#fff" strokeWidth={5} />
        ))}
      </svg>
      <div className="relative flex h-full flex-col items-center justify-center gap-6 text-center">
        <p className="font-display text-3xl leading-tight">Tasa tu propiedad</p>
        <span className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-ink">Comenzar</span>
      </div>
    </div>
  );
}
