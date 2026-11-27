"use client";

import { leadCreateSchema } from "@portal/shared/lead";
import type { ValuationAmenity, ValuationRequest, ValuationResult } from "@portal/shared/valuation";
import { useEffect, useRef, useState } from "react";
import { AmenitiesStep } from "@/components/tasador/amenities-step";
import { ValuationForm } from "@/components/tasador/valuation-form";
import { ValuationGate, type GateContact } from "@/components/tasador/valuation-gate";
import { ValuationMapLoader } from "@/components/tasador/valuation-map-loader";
import { ValuationResultView } from "@/components/tasador/valuation-result";
import { summarizeValuation } from "@/components/tasador/valuation-summary";
import { ApiClientError } from "@/lib/api-client";
import { trackEvent } from "@/lib/analytics";
import { submitLead } from "@/lib/lead-submission";
import { DEFAULT_MAP_LOCATION, locateInBrowser } from "@/lib/geocode-client";
import type { MapLocation } from "@/lib/property-location";
import { requestValuation } from "@/lib/valuation-api";

type Step = "data" | "amenities" | "gate" | "summary";

// Public by design (see .env.example); inlined at build time.
const web3FormsAccessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
type Estimate = { request: ValuationRequest; result: ValuationResult };
type LocationQuery = { address: string; commune: string };

/**
 * Four steps in two columns, with a map that follows the address on the right: (1) data, (2) amenities,
 * (3) name and email, required to see the price, (4) the summary.
 */
export function PropertyValuator() {
  const [step, setStep] = useState<Step>("data");
  // Bumped to remount the data form (and clear it) when starting over.
  const [formKey, setFormKey] = useState(0);
  const [draft, setDraft] = useState<ValuationRequest | null>(null);
  const [amenities, setAmenities] = useState<ValuationAmenity[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const [query, setQuery] = useState<LocationQuery | null>(null);
  const [location, setLocation] = useState<MapLocation>(DEFAULT_MAP_LOCATION);
  const [isLocated, setIsLocated] = useState(false);
  const lastQuery = useRef("");

  // One Nominatim lookup per distinct address, cancelled if a newer one starts (its policy allows ~1 per second).
  useEffect(() => {
    if (!query || (!query.commune && query.address.trim().length < 3)) return;
    const key = `${query.address.trim()}|${query.commune}`;
    if (key === lastQuery.current) return;
    lastQuery.current = key;
    const controller = new AbortController();
    void locateInBrowser(query, controller.signal).then((found) => {
      if (!found || controller.signal.aborted) return;
      setLocation(found);
      setIsLocated(true);
    });
    return () => controller.abort();
  }, [query]);

  function goToAmenities(request: ValuationRequest) {
    setDraft(request);
    setQuery({ address: request.address, commune: request.commune });
    setStep("amenities");
  }

  /** Computes the price, stores the lead and only then shows the summary. Returns an error message, or null. */
  async function revealPrice(contact: GateContact): Promise<string | null> {
    if (!draft) return "Vuelve a ingresar los datos de la propiedad.";
    // The located address picks the sector of the reference table; without it the estimate uses the commune average.
    const request: ValuationRequest = {
      ...draft,
      amenities,
      ...(isLocated ? { latitude: location.latitude, longitude: location.longitude } : {}),
    };
    let result: ValuationResult;
    try {
      result = await requestValuation(request);
    } catch (error) {
      return error instanceof ApiClientError ? error.message : "No pudimos calcular el precio. Inténtalo de nuevo.";
    }
    const parsed = leadCreateSchema.safeParse({
      kind: "VALUATION",
      source: "tasador",
      name: contact.name,
      email: contact.email,
      address: request.address,
      commune: request.commune,
      message: summarizeValuation(request, result),
      website: contact.website,
    });
    if (!parsed.success) return parsed.error.issues[0]?.message ?? "Revisa tu nombre y correo.";
    const sent = await submitLead(parsed.data, web3FormsAccessKey);
    if (sent.status === "error") return sent.message;
    trackEvent("generate_lead", { lead_source: "tasador" });
    setEstimate({ request, result });
    setStep("summary");
    return null;
  }

  function restart() {
    setStep("data");
    setDraft(null);
    setAmenities([]);
    setEstimate(null);
    setFormKey((key) => key + 1);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="min-w-0">
        {/* Hidden, not unmounted, so «Atrás» finds the data as it was left. */}
        <div hidden={step !== "data"}>
          <ValuationForm key={formKey} onContinue={goToAmenities} onLocationChange={setQuery} />
        </div>
        {step === "amenities" && (
          <AmenitiesStep
            selected={amenities}
            onToggle={(amenity) =>
              setAmenities((current) =>
                current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity],
              )
            }
            onBack={() => setStep("data")}
            onSubmit={() => setStep("gate")}
            isSending={false}
            errorMessage=""
          />
        )}
        {step === "gate" && <ValuationGate onSubmit={revealPrice} onBack={() => setStep("amenities")} />}
        {step === "summary" && estimate && (
          <ValuationResultView
            request={estimate.request}
            result={estimate.result}
            onRestart={restart}
          />
        )}
      </div>
      <div className="relative z-0 h-80 overflow-hidden rounded-xl shadow-lift ring-1 ring-accent/30 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:min-h-[28rem] lg:self-start">
        <ValuationMapLoader location={location} showPin={isLocated} label="Mapa de la ubicación de la propiedad" />
      </div>
    </div>
  );
}
