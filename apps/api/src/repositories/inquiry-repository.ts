import "server-only";
import { prisma } from "@/lib/prisma";

export type NewInquiry = {
  propertyId: string;
  propertyTitle: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
};

const inquiryCreatedSelect = {
  id: true,
  propertyId: true,
  propertyTitle: true,
  createdAt: true,
} as const;

export function insertInquiry(data: NewInquiry) {
  return prisma.inquiry.create({ data, select: inquiryCreatedSelect });
}
