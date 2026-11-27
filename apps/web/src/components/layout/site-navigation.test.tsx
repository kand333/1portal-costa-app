import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SiteNavigation } from "./site-navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/tasador-propiedades", useRouter: () => ({ refresh: () => undefined }) }));
vi.mock("@/hooks/use-current-user", () => ({ useCurrentUser: () => ({ data: undefined }) }));

describe("SiteNavigation", () => {
  it("marks no link as current while rendering on the server, so hydration cannot disagree with the URL", () => {
    expect(renderToStaticMarkup(<SiteNavigation />)).not.toContain("aria-current");
  });
});
