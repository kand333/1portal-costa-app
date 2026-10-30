import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CountUp } from "./count-up";

describe("CountUp", () => {
  it("renders the final number in the server HTML", () => {
    expect(renderToStaticMarkup(<CountUp value={1200} />)).toBe("<span>1.200</span>");
  });

  it("renders the suffix after the number", () => {
    expect(renderToStaticMarkup(<CountUp value={14} suffix="+" />)).toBe("<span>14+</span>");
  });

  it("renders the prefix before the number", () => {
    expect(renderToStaticMarkup(<CountUp value={0} prefix="$" />)).toBe("<span>$0</span>");
  });
});
