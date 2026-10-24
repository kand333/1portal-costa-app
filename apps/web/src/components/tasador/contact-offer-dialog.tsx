"use client";

import type { ValuationRequest, ValuationResult } from "@portal/shared/valuation";
import { useEffect, useId, useRef, useState } from "react";
import { CommuneProvider } from "@/components/home/commune-context";
import { LeadForm } from "@/components/home/lead-form";
import { summarizeValuation } from "@/components/tasador/valuation-summary";
import { useCurrentUser } from "@/hooks/use-current-user";

type ContactOfferDialogProps = {
  /** The estimate this dialog is about; null keeps it closed. */
  estimate: { request: ValuationRequest; result: ValuationResult } | null;
  /** Starts directly on the contact form (the «Quiero que me contacten» button of the summary). */
  startWithForm: boolean;
  /** `contacted`: the person left their data. Closing otherwise just shows the summary. */
  onClose: (contacted: boolean) => void;
};

/**
 * Modal shown once the estimate is ready: it offers a call from a broker. «Quiero que me contacten» opens the
 * contact form inside the same dialog; «No, solo quiero saber el precio» goes on to the summary.
 * Built on the native <dialog>: showModal() traps the focus and Escape closes it.
 */
export function ContactOfferDialog({ estimate, startWithForm, onClose }: ContactOfferDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { data: currentUser } = useCurrentUser();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const showForm = isFormOpen || startWithForm;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (estimate && !dialog.open) dialog.showModal();
    if (!estimate && dialog.open) dialog.close();
  }, [estimate]);

  function close(contacted: boolean) {
    setIsFormOpen(false);
    onClose(contacted);
  }

  const firstName = currentUser?.name.split(" ")[0];

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close(false);
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.25rem] border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
    >
      {estimate && (
        <div className="p-6 sm:p-8">
          {showForm ? (
            <>
              <h2 id={titleId} className="font-display text-2xl font-semibold tracking-tight">
                Deja tus datos
              </h2>
              <p className="mb-5 mt-1 text-sm text-muted">Un corredor te contactará para afinar el precio de tu propiedad.</p>
              <CommuneProvider initialCommune={estimate.request.commune}>
                <LeadForm
                  source="tasador"
                  idPrefix="valuation-lead"
                  fixedKind="VALUATION"
                  initialAddress={estimate.request.address}
                  message={summarizeValuation(estimate.request, estimate.result)}
                  onSent={() => close(true)}
                />
              </CommuneProvider>
              <button
                type="button"
                onClick={() => close(false)}
                className="mt-5 border-b border-brass pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
              >
                Volver al precio
              </button>
            </>
          ) : (
            <>
              <h2 id={titleId} className="font-display text-3xl font-semibold tracking-tight">
                {firstName ? `Tu precio está listo, ${firstName}` : "Tu precio está listo"}
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                ¿Quieres que un corredor de nuestro equipo te contacte? Te ayuda a afinar el precio con la visita a la
                propiedad y a decidir cómo publicarla. No tiene costo ni compromiso.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="h-12 rounded-full bg-accent px-6 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0"
                >
                  Quiero que me contacten
                </button>
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="h-12 rounded-full border border-line px-6 font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-paper"
                >
                  No, solo quiero saber el precio
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
