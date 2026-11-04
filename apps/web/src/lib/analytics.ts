/** Google Analytics 4 measurement ids look like `G-ABC123XYZ`. Anything else is ignored (analytics stays off). */
const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;

/** The configured measurement id, or `null` when it is unset or malformed. */
export function getMeasurementId(raw: string | undefined = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID): string | null {
  const id = raw?.trim() ?? "";
  return MEASUREMENT_ID_PATTERN.test(id) ? id : null;
}

type GtagWindow = Window & { gtag?: (command: "event", name: string, parameters: Record<string, string>) => void };

/** Sends a GA4 event. Does nothing when analytics is off or the script has not loaded (ad blockers, no id). */
export function trackEvent(name: string, parameters: Record<string, string> = {}): void {
  if (typeof window === "undefined") return;
  (window as GtagWindow).gtag?.("event", name, parameters);
}
