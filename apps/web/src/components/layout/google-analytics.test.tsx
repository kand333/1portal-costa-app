import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { GoogleAnalytics } from "./google-analytics";

// `next/script` injects its tags in the browser, so server markup is empty: the element tree is checked instead.
describe("GoogleAnalytics", () => {
  it("renders nothing without a valid measurement id", () => {
    expect(GoogleAnalytics({ measurementId: null })).toBeNull();
  });

  it("loads gtag.js and configures the given id", () => {
    const tree = GoogleAnalytics({ measurementId: "G-ABC123XYZ9" }) as ReactElement<{ children: ReactElement<Record<string, unknown>>[] }>;
    const [loader, init] = tree.props.children;
    expect(loader.props.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ9");
    expect(String(init.props.children)).toContain("gtag('config','G-ABC123XYZ9')");
  });
});
