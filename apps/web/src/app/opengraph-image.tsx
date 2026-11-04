import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "PropiZoom: corredora de propiedades en el Gran Concepción";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colors are the brand tokens of globals.css (paper, ink, accent): an image cannot read CSS variables.
export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo-mark.png"));
  const logoSource = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "#fef7e5",
          color: "#231a14",
          borderBottom: "18px solid #f56908",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain elements */}
          <img src={logoSource} width={120} height={116} alt="" />
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, marginLeft: 28 }}>
            <span>Propi</span>
            <span style={{ color: "#f56908" }}>Zoom</span>
          </div>
        </div>
        <div style={{ fontSize: 48, marginTop: 36, lineHeight: 1.2 }}>Corredora de propiedades en el Gran Concepción</div>
        <div style={{ fontSize: 36, marginTop: 20, color: "#b84300", fontWeight: 700 }}>Tasación gratis · Proyectos nuevos · Corretaje</div>
      </div>
    ),
    size,
  );
}
