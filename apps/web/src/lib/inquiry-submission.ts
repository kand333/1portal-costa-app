import type { InquiryCreateData, InquiryCreated } from "@portal/shared/inquiry";
import { ApiClientError, postJson } from "./api-client";

const WEB3FORMS_SUBMIT_URL = "https://api.web3forms.com/submit";

export type InquirySubmissionResult =
  | { status: "sent"; inquiry: InquiryCreated; emailSent: boolean }
  | { status: "error"; message: string };

/**
 * Emails the stored inquiry through Web3Forms. Runs in the browser: the free plan does not accept
 * server submissions. Returns false instead of throwing, since the inquiry is already saved.
 */
export async function sendInquiryEmail(
  accessKey: string,
  inquiry: InquiryCreated,
  data: InquiryCreateData,
): Promise<boolean> {
  try {
    const response = await fetch(WEB3FORMS_SUBMIT_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Consulta por «${inquiry.propertyTitle}»`,
        from_name: "Portal Inmobiliario",
        // Reply goes straight to the visitor.
        replyto: data.email,
        name: data.name,
        email: data.email,
        phone: data.phone ?? "",
        message: data.message,
        property_id: inquiry.propertyId,
        property_title: inquiry.propertyTitle,
        inquiry_id: inquiry.id,
      }),
    });
    const body: unknown = await response.json().catch(() => null);
    return response.ok && Boolean(body && typeof body === "object" && "success" in body && body.success === true);
  } catch {
    return false;
  }
}

/**
 * Contact flow: 1) the API validates and stores the inquiry (it can never be lost); 2) the browser
 * emails it with Web3Forms. An email failure still counts as sent, because the inquiry is stored
 * and visible to the administrator.
 */
export async function submitInquiry(
  data: InquiryCreateData,
  web3FormsAccessKey: string | undefined,
): Promise<InquirySubmissionResult> {
  let inquiry: InquiryCreated;
  try {
    inquiry = await postJson<InquiryCreated>("/api/inquiries", data);
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "No pudimos enviar tu consulta. Revisa tu conexión e inténtalo de nuevo.";
    return { status: "error", message };
  }

  const emailSent = web3FormsAccessKey ? await sendInquiryEmail(web3FormsAccessKey, inquiry, data) : false;
  return { status: "sent", inquiry, emailSent };
}
