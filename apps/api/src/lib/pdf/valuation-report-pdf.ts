import PDFDocument from "pdfkit";
import {
  bulletList,
  drawFooters,
  drawLogo,
  metricGrid,
  notice,
  paragraph,
  sectionTitle,
  subheading,
  table,
} from "@/lib/pdf/report-components";
import { CONTENT_WIDTH, PAGE, REPORT_BRAND } from "@/lib/pdf/report-brand";
import type { ReportContent } from "@/services/valuation-report-data";

const { colors } = REPORT_BRAND;

/** Cover: who and where, then the value large, with its range bar and the figures behind it. */
function drawCover(doc: PDFKit.PDFDocument, content: ReportContent) {
  const { hero } = content;
  const gradient = doc.linearGradient(0, 0, 0, 420);
  gradient.stop(0, "#E6F6F5").stop(1, colors.white);
  doc.rect(0, 0, PAGE.width, 420).fill(gradient);
  drawLogo(doc, PAGE.margin, 44, 34, false);

  const pill = `Informe referencial  |  ${content.issuedOn}`;
  doc.font("Helvetica").fontSize(8.5);
  const pillWidth = doc.widthOfString(pill) + 24;
  doc.roundedRect(PAGE.width - PAGE.margin - pillWidth, 52, pillWidth, 20, 10).lineWidth(0.8).stroke(colors.line);
  doc.fillColor(colors.muted).text(pill, PAGE.width - PAGE.margin - pillWidth + 12, 58, { lineBreak: false });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(colors.muted)
    .text("INFORME DE VALORACIÓN INMOBILIARIA", PAGE.margin, 116, { characterSpacing: 1.3, lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(30).fillColor(colors.navy).text(content.cover.address, PAGE.margin, 134, { width: CONTENT_WIDTH, lineGap: 2 });
  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor(colors.muted)
    .text(`${content.cover.propertyType} en ${content.cover.commune}  ·  ${content.cover.operation}`, PAGE.margin, doc.y + 4, { width: CONTENT_WIDTH });
  doc.font("Courier").fontSize(9.5).fillColor(colors.muted).text(content.summary.facts.find((fact) => fact.label === "Superficie construida")?.value + " construidos", PAGE.margin, doc.y + 8, { width: CONTENT_WIDTH });

  // The card.
  const cardX = PAGE.margin;
  const cardY = Math.max(doc.y + 26, 232);
  const cardWidth = CONTENT_WIDTH;
  const cardHeight = 318;
  doc.roundedRect(cardX + 2, cardY + 4, cardWidth, cardHeight, 14).fill("#E7EDF1");
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 14).lineWidth(0.8).fillAndStroke(colors.white, colors.line);
  const innerX = cardX + 26;
  const innerWidth = cardWidth - 52;

  doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(hero.label.toUpperCase(), innerX, cardY + 24, { characterSpacing: 1.2, lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(50).fillColor(colors.ink);
  const headlineY = cardY + 42;
  doc.text(hero.headline, innerX, headlineY, { lineBreak: false });
  if (hero.headlineSecondary) {
    const headlineWidth = doc.widthOfString(hero.headline);
    doc.font("Helvetica-Bold").fontSize(15).fillColor(colors.turquoiseDark).text(hero.headlineSecondary, innerX + headlineWidth + 14, headlineY + 30, { lineBreak: false });
  }

  // Range bar: a gradient track and a marker where the reference value sits.
  const barY = cardY + 128;
  const track = doc.linearGradient(innerX, 0, innerX + innerWidth, 0);
  track.stop(0, colors.turquoiseSoft).stop(1, colors.turquoise);
  doc.roundedRect(innerX, barY, innerWidth, 8, 4).fill(track);
  const markerX = innerX + innerWidth * hero.markerShare;
  doc.rect(markerX - 1, barY - 6, 2.5, 20).fill(colors.navy);
  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.white);
  const tag = "VALOR DE REFERENCIA";
  const tagWidth = doc.widthOfString(tag, { characterSpacing: 0.8 }) + 16;
  const tagX = Math.min(Math.max(markerX - tagWidth / 2, innerX), innerX + innerWidth - tagWidth);
  doc.roundedRect(tagX, barY - 28, tagWidth, 16, 8).fill(colors.navy);
  doc.fillColor(colors.white).text(tag, tagX + 8, barY - 23, { characterSpacing: 0.8, lineBreak: false });

  // Minimum, reference and maximum.
  const columnY = barY + 26;
  const third = innerWidth / 3;
  const columns: { key: "low" | "mid" | "high"; align: "left" | "center" | "right" }[] = [
    { key: "low", align: "left" },
    { key: "mid", align: "center" },
    { key: "high", align: "right" },
  ];
  columns.forEach(({ key, align }, index) => {
    const entry = hero[key];
    const x = innerX + index * third;
    doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text(entry.label.toUpperCase(), x, columnY, { width: third, align, characterSpacing: 0.9, lineBreak: false });
    doc
      .font("Helvetica-Bold")
      .fontSize(key === "mid" ? 17 : 15)
      .fillColor(key === "mid" ? colors.turquoiseDark : colors.ink)
      .text(entry.value, x, columnY + 14, { width: third, align, lineBreak: false });
    if (entry.sub) doc.font("Helvetica").fontSize(8.5).fillColor(colors.muted).text(entry.sub, x, columnY + 36, { width: third, align, lineBreak: false });
  });

  // Figures behind the value.
  const dividerY = cardY + 236;
  doc.moveTo(innerX, dividerY).lineTo(innerX + innerWidth, dividerY).lineWidth(0.6).stroke(colors.line);
  const quarter = innerWidth / hero.stats.length;
  hero.stats.forEach((stat, index) => {
    const x = innerX + index * quarter + (index === 0 ? 0 : 10);
    const width = quarter - 14;
    if (index > 0) doc.moveTo(innerX + index * quarter, dividerY + 12).lineTo(innerX + index * quarter, dividerY + 62).lineWidth(0.5).stroke(colors.line);
    doc.font("Helvetica").fontSize(7).fillColor(colors.muted).text(stat.label.toUpperCase(), x, dividerY + 14, { width, characterSpacing: 0.5 });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(colors.ink).text(stat.value, x, dividerY + 36, { width, lineBreak: false });
    doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(stat.sub, x, dividerY + 54, { width });
  });

  doc.font("Helvetica").fontSize(9).fillColor(colors.muted).text(hero.sourceNote, PAGE.margin, cardY + cardHeight + 22, { width: CONTENT_WIDTH, lineGap: 3 });
  doc.y = cardY + cardHeight + 60;
}

function drawSummary(doc: PDFKit.PDFDocument, content: ReportContent) {
  doc.addPage();
  doc.y = PAGE.margin;
  sectionTitle(doc, "Resumen ejecutivo", "Lo esencial");

  const { summary } = content;
  metricGrid(doc, summary.facts, 3);
  doc.y += 6;

  subheading(doc, "Qué significa este valor");
  for (const text of summary.meaning) paragraph(doc, text);
  if (summary.conversionNote) notice(doc, summary.conversionNote, summary.conversionNote.startsWith("No se pudo") ? "warning" : "info");
}

function drawCharacteristics(doc: PDFKit.PDFDocument, content: ReportContent) {
  doc.addPage();
  doc.y = PAGE.margin;
  sectionTitle(doc, "Características de la propiedad", "Ficha");
  paragraph(
    doc,
    "Cada dato indica su origen. «Informado por el propietario» quiere decir que lo ingresó quien pidió la valoración y no se verificó con documentos. «Sin antecedentes» es un dato que el sistema no tiene.",
    { size: 10, color: "#5B6B7A" },
  );
  table(
    doc,
    content.characteristics.map((row) => ({
      cells: [row.label, row.value],
      badge: row.status === "informed" ? { text: "Informado por el propietario", tone: "ok" as const } : { text: "Sin antecedentes", tone: "pending" as const },
    })),
    [170, 190, 144],
  );
}

function drawMarket(doc: PDFKit.PDFDocument, content: ReportContent) {
  doc.addPage();
  doc.y = PAGE.margin;
  sectionTitle(doc, "Mercado y comparables", "Cómo se calculó");
  metricGrid(doc, content.market.stats, 2);
  doc.y += 6;
  bulletList(doc, content.market.notes);

  if (content.market.amenities.length > 0) {
    doc.y += 6;
    subheading(doc, "Amenidades consideradas");
    table(
      doc,
      content.market.amenities.map((amenity) => ({ cells: [amenity.label, amenity.adjustment] })),
      [170, 334, 0],
    );
  }

}

function drawConclusion(doc: PDFKit.PDFDocument, content: ReportContent) {
  doc.addPage();
  doc.y = PAGE.margin;
  sectionTitle(doc, "Conclusión y limitaciones", "Alcance del informe");
  paragraph(doc, content.conclusion.synthesis, { size: 12 });

  if (content.recommendations.length > 0) {
    subheading(doc, "Recomendaciones según los datos");
    bulletList(doc, content.recommendations);
    doc.y += 6;
  }

  subheading(doc, "Fuente y fecha");
  paragraph(doc, `Fuente: ${content.conclusion.source}`, { size: 10.5 });
  paragraph(doc, `Fecha de referencia: ${content.conclusion.referenceDate}.`, { size: 10.5 });

  subheading(doc, "Datos pendientes de verificación");
  bulletList(doc, content.conclusion.pending);

  doc.y += 6;
  subheading(doc, "Alcance y limitaciones");
  for (const text of content.conclusion.scope) notice(doc, text, "warning");
}

/** Draws the report on US Letter pages (selectable text, vector logo) and resolves with the PDF bytes. */
export function renderValuationReport(content: ReportContent): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
    bufferPages: true,
    info: {
      Title: `Informe de valoración inmobiliaria: ${content.cover.address}, ${content.cover.commune}`,
      Author: REPORT_BRAND.name,
      Subject: "Valoración referencial",
      Creator: REPORT_BRAND.name,
    },
  });
  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  drawCover(doc, content);
  drawSummary(doc, content);
  drawCharacteristics(doc, content);
  drawMarket(doc, content);
  drawConclusion(doc, content);
  drawFooters(doc);
  doc.end();
  return finished;
}
