import type { LeadCreateData, LeadCreated } from "@portal/shared/lead";
import { ApiClientError, postJson } from "./api-client";

const WEB3FORMS_SUBMIT_URL = "https://api.web3forms.com/submit";

export type LeadSubmissionResult =
  | { status: "sent"; lead: LeadCreated; emailSent: boolean }
  | { status: "error"; message: string };

/** Emails the stored lead through Web3Forms (browser only). Returns false instead of throwing: the lead is already saved. */
export async function sendLeadEmail(accessKey: string, lead: LeadCreated, data: LeadCreateData): Promise<boolean> {
  try {
    const response = await fetch(WEB3FORMS_SUBMIT_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: data.kind === "VALUATION" ? "Solicitud de tasación" : "Búsqueda de propiedad",
        from_name: "PropiZoom",
        replyto: data.email,
        name: data.name,
        email: data.email,
        phone: data.phone ?? "",
        address: data.address ?? "",
        commune: data.commune ?? "",
        operation: data.operation ?? "",
        property_type: data.propertyType ?? "",
        message: data.message ?? "",
        source: data.source,
        lead_id: lead.id,
      }),
    });
    const body: unknown = await response.json().catch(() => null);
    return response.ok && Boolean(body && typeof body === "object" && "success" in body && body.success === true);
  } catch {
    return false;
  }
}

/** 1) The API validates and stores the lead; 2) the browser emails it. An email failure still counts as sent. */
export async function submitLead(
  data: LeadCreateData,
  web3FormsAccessKey: string | undefined,
): Promise<LeadSubmissionResult> {
  let lead: LeadCreated;
  try {
    lead = await postJson<LeadCreated>("/api/leads", data);
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.";
    return { status: "error", message };
  }

  const emailSent = web3FormsAccessKey ? await sendLeadEmail(web3FormsAccessKey, lead, data) : false;
  return { status: "sent", lead, emailSent };
}
