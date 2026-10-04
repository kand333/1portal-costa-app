import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { addPropertyImage } from "@/services/property-image-service";
import {
  MAX_PROPERTY_IMAGE_BYTES,
  PROPERTY_IMAGE_FIELD,
  PROPERTY_IMAGE_MESSAGES,
} from "@portal/shared/property-image";
import { propertyIdSchema } from "@portal/shared/property-query";

// Room for the multipart boundaries and headers around the file.
const MAX_REQUEST_BYTES = MAX_PROPERTY_IMAGE_BYTES + 64 * 1024;

/** Uploads an image of a property to Cloudinary (multipart field `file`) and stores it. ADMIN only. */
export async function POST(request: NextRequest, context: RouteContext<"/api/admin/properties/[id]/images">) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!propertyIdSchema.safeParse(id).success) return errorResponse(400, "Identificador de propiedad inválido");

    // Reject an oversized body before reading it.
    if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) {
      return errorResponse(413, PROPERTY_IMAGE_MESSAGES.tooLarge);
    }
    const form = await request.formData().catch(() => null);
    const file = form?.get(PROPERTY_IMAGE_FIELD);
    if (!(file instanceof Blob)) return errorResponse(400, PROPERTY_IMAGE_MESSAGES.missing);

    return NextResponse.json(await addPropertyImage(id, file), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
