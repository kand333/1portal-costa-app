import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/api-error";
import * as inquiryRepository from "@/repositories/inquiry-repository";
import * as propertyRepository from "@/repositories/property-repository";
import { createInquiry } from "./inquiry-service";

vi.mock("@/repositories/property-repository", () => ({ findPublishedPropertyById: vi.fn() }));
vi.mock("@/repositories/inquiry-repository", () => ({ insertInquiry: vi.fn() }));

const propertyId = "5eed0000-0000-4000-8000-000000000001";
const data = {
  propertyId,
  name: "María Pérez",
  email: "maria@correo.cl",
  phone: undefined,
  message: "Me interesa visitar la propiedad.",
};

beforeEach(() => vi.resetAllMocks());

describe("createInquiry", () => {
  it("stores the inquiry with the property title and no user, and returns it", async () => {
    vi.mocked(propertyRepository.findPublishedPropertyById).mockResolvedValue({ id: propertyId, title: "Casa" } as never);
    vi.mocked(inquiryRepository.insertInquiry).mockResolvedValue({
      id: "inquiry-1",
      propertyId,
      propertyTitle: "Casa",
      createdAt: new Date("2026-10-02T12:00:00.000Z"),
    });

    await expect(createInquiry(data)).resolves.toEqual({
      id: "inquiry-1",
      propertyId,
      propertyTitle: "Casa",
      createdAt: "2026-10-02T12:00:00.000Z",
    });
    expect(inquiryRepository.insertInquiry).toHaveBeenCalledWith({
      propertyId,
      propertyTitle: "Casa",
      userId: null,
      name: "María Pérez",
      email: "maria@correo.cl",
      phone: null,
      message: "Me interesa visitar la propiedad.",
    });
  });

  it("rejects a property that does not exist or is not published with 404, without storing anything", async () => {
    vi.mocked(propertyRepository.findPublishedPropertyById).mockResolvedValue(null);

    await expect(createInquiry(data)).rejects.toEqual(new ApiError(404, "Propiedad no encontrada"));
    expect(inquiryRepository.insertInquiry).not.toHaveBeenCalled();
  });
});
