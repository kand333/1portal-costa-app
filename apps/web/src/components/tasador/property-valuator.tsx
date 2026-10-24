"use client";

import type { ValuationAmenity, ValuationRequest, ValuationResult } from "@portal/shared/valuation";
import { useEffect, useRef, useState } from "react";
import { AmenitiesStep } from "@/components/tasador/amenities-step";
import { ContactOfferDialog } from "@/components/tasador/contact-offer-dialog";
import { ValuationForm } from "@/components/tasador/valuation-form";
import { ValuationMapLoader } from "@/components/tasador/valuation-map-loader";
import { ValuationResultView } from "@/components/tasador/valuation-result";
import { ApiClientError } from "@/lib/api-client";
import { DEFAULT_MAP_LOCATION, locateInBrowser } from "@/lib/geocode-client";
import type { MapLocation } from "@/lib/property-location";
import { requestValuation } from "@/lib/valuation-api";

type Step = "data" | "amenities" | "summary";
type Estimate = { request: ValuationRequest; result: ValuationResult };
type LocationQuery = { address: string; commune: string };

/**
 * Four steps in two columns, with a map that follows the address on the right: (1) data, (2) amenities,
 * (3) a dialog offering contact once the price is ready, (4) the summary.
 */
export function PropertyValuator() {
  const [step, setStep] = useState<Step>("data");
  // Bumped to remount the data form (and clear it) when starting over.
  const [formKey, setFormKey] = useState(0);
  const [draft, setDraft] = useState<ValuationRequest | null>(null);
  const [amenities, setAmenities] = useState<ValuationAmenity[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStartsWithForm, setDialogStartsWithForm] = useState(false);
  const [contacted, setContacted] = useState(false);

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
    setErrorMessage("");
    setStep("amenities");
  }

  async function estimatePrice() {
    if (!draft || isSending) return;
    const request: ValuationRequest = { ...draft, amenities };
    setIsSending(true);
    setErrorMessage("");
    try {
      const result = await requestValuation(request);
      setEstimate({ request, result });
      setContacted(false);
      setDialogStartsWithForm(false);
      setIsDialogOpen(true);
      setStep("summary");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError ? error.message : "No pudimos calcular el precio. Inténtalo de nuevo.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function restart() {
    setStep("data");
    setDraft(null);
    setAmenities([]);
    setEstimate(null);
    setContacted(false);
    setFormKey((key) => key + 1);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div>
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
            onSubmit={() => void estimatePrice()}
            isSending={isSending}
            errorMessage={errorMessage}
          />
        )}
        {step === "summary" && estimate && (
          <ValuationResultView
            request={estimate.request}
            result={estimate.result}
            contacted={contacted}
            onContact={() => {
              setDialogStartsWithForm(true);
              setIsDialogOpen(true);
            }}
            onRestart={restart}
          />
        )}
      </div>
      <div className="relative z-0 h-80 overflow-hidden rounded-xl shadow-lift ring-1 ring-line lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:min-h-[28rem] lg:self-start">
        <ValuationMapLoader location={location} showPin={isLocated} label="Mapa de la ubicación de la propiedad" />
      </div>
      <ContactOfferDialog
        estimate={isDialogOpen ? estimate : null}
        startWithForm={dialogStartsWithForm}
        onClose={(didContact) => {
          if (didContact) setContacted(true);
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
