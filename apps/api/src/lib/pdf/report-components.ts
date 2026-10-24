import { CONTENT_WIDTH, PAGE, REPORT_BRAND } from "@/lib/pdf/report-brand";

type Doc = PDFKit.PDFDocument;
const { colors } = REPORT_BRAND;

const REGULAR = "Helvetica";
const BOLD = "Helvetica-Bold";

/** Lowest y a block may reach before the footer. */
export const CONTENT_BOTTOM = PAGE.height - PAGE.margin - PAGE.footerHeight;

/** Starts a new page when the next block (of `height` points) would not fit above the footer. */
export function ensureSpace(doc: Doc, height: number) {
  if (doc.y + height > CONTENT_BOTTOM) {
    doc.addPage();
    doc.y = PAGE.margin;
  }
}

export function textHeight(doc: Doc, text: string, size: number, width: number, font: string = REGULAR, lineGap = 2) {
  return doc.font(font).fontSize(size).heightOfString(text, { width, lineGap });
}

/** Vector logotype: a turquoise badge with a house, then the name. Drawn, so it is always sharp. */
export function drawLogo(doc: Doc, x: number, y: number, size: number, onDark: boolean) {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  doc.circle(centerX, centerY, size / 2).fill(colors.turquoise);
  doc
    .polygon(
      [centerX - size * 0.3, centerY - size * 0.02],
      [centerX, centerY - size * 0.32],
      [centerX + size * 0.3, centerY - size * 0.02],
    )
    .fill(colors.white);
  doc.rect(centerX - size * 0.2, centerY - size * 0.02, size * 0.4, size * 0.3).fill(colors.white);
  doc.rect(centerX - size * 0.06, centerY + size * 0.1, size * 0.12, size * 0.18).fill(colors.turquoise);
  doc
    .font(BOLD)
    .fontSize(size * 0.5)
    .fillColor(onDark ? colors.white : colors.navy)
    .text(REPORT_BRAND.name, x + size + 10, y + size * 0.25, { lineBreak: false });
}

/** Section heading with a short turquoise rule. */
export function sectionTitle(doc: Doc, title: string, kicker?: string) {
  ensureSpace(doc, 70);
  if (kicker) {
    doc.font(BOLD).fontSize(9).fillColor(colors.turquoise).text(kicker.toUpperCase(), PAGE.margin, doc.y, {
      width: CONTENT_WIDTH,
      characterSpacing: 1.2,
    });
    doc.moveDown(0.3);
  }
  doc.font(BOLD).fontSize(22).fillColor(colors.navy).text(title, PAGE.margin, doc.y, { width: CONTENT_WIDTH });
  const ruleY = doc.y + 6;
  doc.rect(PAGE.margin, ruleY, 44, 3).fill(colors.turquoise);
  doc.y = ruleY + 18;
}

export function paragraph(doc: Doc, text: string, options: { size?: number; color?: string; width?: number; gap?: number } = {}) {
  const size = options.size ?? 11;
  const width = options.width ?? CONTENT_WIDTH;
  ensureSpace(doc, textHeight(doc, text, size, width, REGULAR, 3) + 4);
  doc.font(REGULAR).fontSize(size).fillColor(options.color ?? colors.ink).text(text, PAGE.margin, doc.y, { width, lineGap: 3 });
  doc.y += options.gap ?? 8;
}

export function subheading(doc: Doc, text: string) {
  ensureSpace(doc, 40);
  doc.font(BOLD).fontSize(13).fillColor(colors.navy).text(text, PAGE.margin, doc.y, { width: CONTENT_WIDTH });
  doc.y += 8;
}

export function bulletList(doc: Doc, items: readonly string[], size = 10.5) {
  const indent = 14;
  const width = CONTENT_WIDTH - indent;
  for (const item of items) {
    const height = textHeight(doc, item, size, width, REGULAR, 3);
    ensureSpace(doc, height + 6);
    const top = doc.y;
    doc.circle(PAGE.margin + 4, top + size * 0.55, 2).fill(colors.turquoise);
    doc.font(REGULAR).fontSize(size).fillColor(colors.ink).text(item, PAGE.margin + indent, top, { width, lineGap: 3 });
    doc.y = top + height + 6;
  }
}

/** A labelled figure in a soft card. */
export function metricCard(doc: Doc, x: number, y: number, width: number, height: number, label: string, value: string) {
  doc.roundedRect(x, y, width, height, 8).fill(colors.paper);
  doc.font(REGULAR).fontSize(9).fillColor(colors.muted).text(label, x + 12, y + 10, { width: width - 24 });
  doc.font(BOLD).fontSize(13).fillColor(colors.navy).text(value, x + 12, y + 26, { width: width - 24 });
}

/** Grid of metric cards, `columns` per row. */
export function metricGrid(doc: Doc, items: readonly { label: string; value: string }[], columns: number, cardHeight = 52) {
  const gap = 12;
  const width = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
  const rows = Math.ceil(items.length / columns);
  ensureSpace(doc, rows * (cardHeight + gap));
  const top = doc.y;
  items.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    metricCard(doc, PAGE.margin + column * (width + gap), top + row * (cardHeight + gap), width, cardHeight, item.label, item.value);
  });
  doc.y = top + rows * (cardHeight + gap) + 4;
}

/** Box with a colored bar for warnings and limits. */
export function notice(doc: Doc, text: string, tone: "info" | "warning" = "info") {
  const padding = 12;
  const width = CONTENT_WIDTH - padding * 2 - 6;
  const height = textHeight(doc, text, 10, width, REGULAR, 3) + padding * 2;
  ensureSpace(doc, height + 8);
  const top = doc.y;
  const background = tone === "warning" ? colors.warningSoft : colors.turquoiseSoft;
  const bar = tone === "warning" ? colors.warning : colors.turquoise;
  doc.roundedRect(PAGE.margin, top, CONTENT_WIDTH, height, 6).fill(background);
  doc.rect(PAGE.margin, top, 4, height).fill(bar);
  doc
    .font(REGULAR)
    .fontSize(10)
    .fillColor(tone === "warning" ? colors.warning : colors.navy)
    .text(text, PAGE.margin + padding + 6, top + padding, { width, lineGap: 3 });
  doc.y = top + height + 10;
}

type TableRow = { cells: string[]; badge?: { text: string; tone: "ok" | "pending" } };

/** Rows of label / value (and an optional status badge) that never split across pages. */
export function table(doc: Doc, rows: readonly TableRow[], widths: readonly [number, number, number]) {
  const [labelWidth, valueWidth, badgeWidth] = widths;
  const padding = 7;
  rows.forEach((row, index) => {
    const label = row.cells[0] ?? "";
    const value = row.cells[1] ?? "";
    const height =
      Math.max(
        textHeight(doc, label, 10, labelWidth - 8, REGULAR),
        textHeight(doc, value, 10.5, valueWidth - 8, BOLD),
        row.badge ? textHeight(doc, row.badge.text, 8.5, badgeWidth - 16, BOLD) + 6 : 0,
      ) +
      padding * 2;
    ensureSpace(doc, height);
    const top = doc.y;
    if (index % 2 === 0) doc.rect(PAGE.margin, top, CONTENT_WIDTH, height).fill(colors.paper);
    doc.font(REGULAR).fontSize(10).fillColor(colors.muted).text(label, PAGE.margin + 8, top + padding, { width: labelWidth - 8 });
    doc.font(BOLD).fontSize(10.5).fillColor(colors.ink).text(value, PAGE.margin + labelWidth, top + padding, { width: valueWidth - 8 });
    if (row.badge) {
      const badgeX = PAGE.margin + labelWidth + valueWidth;
      const background = row.badge.tone === "ok" ? colors.turquoiseSoft : colors.warningSoft;
      const color = row.badge.tone === "ok" ? colors.navy : colors.warning;
      doc.roundedRect(badgeX, top + padding - 2, badgeWidth - 8, height - padding * 2 + 4, 4).fill(background);
      doc.font(BOLD).fontSize(8.5).fillColor(color).text(row.badge.text, badgeX + 6, top + padding + 1, { width: badgeWidth - 20 });
    }
    doc.y = top + height;
  });
  doc.y += 10;
}

/** Page number and the standing warning, on every page. Call once after all pages exist. */
export function drawFooters(doc: Doc) {
  const { start, count } = doc.bufferedPageRange();
  for (let index = 0; index < count; index += 1) {
    doc.switchToPage(start + index);
    // Lower the bottom margin so writing in the footer band does not start a new page.
    doc.page.margins.bottom = 0;
    const lineY = PAGE.height - 38;
    doc.moveTo(PAGE.margin, lineY).lineTo(PAGE.width - PAGE.margin, lineY).lineWidth(0.5).stroke(colors.line);
    doc
      .font(REGULAR)
      .fontSize(8)
      .fillColor(colors.muted)
      .text(`${REPORT_BRAND.name}  |  Informe referencial: no es una tasación profesional ni garantiza un precio de venta`, PAGE.margin, lineY + 8, {
        width: CONTENT_WIDTH - 70,
        lineBreak: false,
      });
    doc.text(`Página ${index + 1} de ${count}`, PAGE.width - PAGE.margin - 66, lineY + 8, {
      width: 66,
      align: "right",
      lineBreak: false,
    });
  }
}
