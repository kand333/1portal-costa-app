import { inquiryIdSchema, type AdminInquiryDetail as AdminInquiryDetailData } from "@portal/shared/inquiry";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminInquiryDetail } from "@/components/admin/admin-inquiry-detail";
import { AccessDenied } from "@/components/auth/access-denied";
import { findWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Consulta | Administración | Portal Inmobiliario",
  robots: { index: false },
};

export default async function AdminInquiryPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  const { id } = await params;
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser(`/admin/inquiries/${encodeURIComponent(id)}`))) return <AccessDenied />;

  // An id that is not a UUID cannot exist: 404 without asking the API (which would answer 400).
  if (!inquiryIdSchema.safeParse(id).success) notFound();
  const inquiry = await findWithSession<AdminInquiryDetailData>(`/api/admin/inquiries/${id}`);
  if (!inquiry) notFound();
  return <AdminInquiryDetail inquiry={inquiry} />;
}
