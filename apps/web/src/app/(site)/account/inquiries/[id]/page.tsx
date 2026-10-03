import { inquiryIdSchema, type UserInquiryDetail } from "@portal/shared/inquiry";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InquiryConversation } from "@/components/account/inquiry-conversation";
import { findWithSession, requireCustomerUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Tu consulta | Portal Inmobiliario",
  robots: { index: false },
};

export default async function AccountInquiryPage({ params }: PageProps<"/account/inquiries/[id]">) {
  const { id } = await params;
  // Checked in the page too, not only in the layout. An ADMIN answers from /admin/inquiries.
  const user = await requireCustomerUser(`/account/inquiries/${encodeURIComponent(id)}`, "/admin/inquiries");

  if (!inquiryIdSchema.safeParse(id).success) notFound();
  const inquiry = await findWithSession<UserInquiryDetail>(`/api/account/inquiries/${id}`);
  if (!inquiry) notFound();
  return <InquiryConversation inquiry={inquiry} userName={user.name} />;
}
