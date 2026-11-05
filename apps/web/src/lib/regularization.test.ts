import { describe, expect, it } from "vitest";
import { buildRegularizationMessage, buildRegularizationUrl, PROPERTY_PROBLEMS } from "./regularization";

describe("regularization", () => {
  it("describes every problem with a path of three steps", () => {
    expect(PROPERTY_PROBLEMS.length).toBeGreaterThanOrEqual(5);
    expect(new Set(PROPERTY_PROBLEMS.map((problem) => problem.id)).size).toBe(PROPERTY_PROBLEMS.length);
    for (const problem of PROPERTY_PROBLEMS) {
      expect(problem.steps).toHaveLength(3);
      expect(problem.meaning).not.toBe("");
    }
  });

  it("names the chosen problem in the WhatsApp text", () => {
    const [first] = PROPERTY_PROBLEMS;
    expect(buildRegularizationMessage(first)).toContain(first.label.toLowerCase());
    expect(buildRegularizationMessage()).toContain("propiedad con problemas");
  });

  it("builds a wa.me link and returns null without a number", () => {
    const url = buildRegularizationUrl("+56 9 2059 3331", PROPERTY_PROBLEMS[0]);
    expect(url).toMatch(/^https:\/\/wa\.me\/56920593331\?text=/);
    expect(buildRegularizationUrl(undefined)).toBeNull();
  });
});
