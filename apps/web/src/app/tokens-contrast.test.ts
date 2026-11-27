import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");
const rootBlock = css.slice(css.indexOf(":root {"), css.indexOf("@media (min-width: 640px)"));

function token(name: string): string {
  const match = rootBlock.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`Token --${name} is not a plain hex value in :root`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light! + 0.05) / (dark! + 0.05);
}

// Text pairs the site relies on (AA for normal text = 4.5:1).
const PAIRS: [string, string][] = [
  ["ink", "paper"],
  ["ink", "surface"],
  ["ink", "sand"],
  ["ink", "night"],
  ["muted", "paper"],
  ["muted", "surface"],
  ["muted", "sand"],
  ["brass-text", "paper"],
  ["brass-text", "surface"],
  ["brass-text", "sand"],
  ["brass-text", "night"],
  ["on-accent", "accent"],
  ["success", "surface"],
  ["danger", "surface"],
  ["agent", "surface"],
  ["on-agent", "agent"],
];

describe("design tokens", () => {
  it.each(PAIRS)("keeps %s readable on %s (AA, 4.5:1)", (foreground, background) => {
    expect(contrast(token(foreground), token(background))).toBeGreaterThanOrEqual(4.5);
  });
});
