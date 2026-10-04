import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { addPropertyImage, arrangePropertyImages } from "@/services/property-image-service";
import {
  MAX_PROPERTY_IMAGE_BYTES,
  PROPERTY_IMAGE_FIELD,
  PROPERTY_IMAGE_MESSAGES,
  propertyImageArrangementSchema,
} from "@portal/shared/property-image";
import { propertyIdSchema } from "@portal/shared/property-query";

type PropertyImagesContext = RouteContext<"/api/admin/properties/[id]/images">;

const INVALID_ID = "Identificador de propiedad inválido";

// Room for the multipart boundaries and headers around the file.
const MAX_REQUEST_BYTES = MAX_PROPERTY_IMAGE_BYTES + 64 * 1024;

/** Uploads an image of a property to Cloudinary (multipart field `file`) and stores it. ADMIN only. */
export async function POST(request: NextRequest, context: PropertyImagesContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!propertyIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);

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

/** Sets the order of the images and the main one (`{ order, mainImageId }`). ADMIN only. */
export async function PUT(request: NextRequest, context: PropertyImagesContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!propertyIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = propertyImageArrangementSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Orden de imágenes inválido");
    return NextResponse.json(await arrangePropertyImages(id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
