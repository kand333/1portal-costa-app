import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_SHARE_IMAGE } from "@/lib/brand-share-image";
import { GUIDE_SECTIONS, guidePath, listGuides, SHOW_DRAFT_GUIDES, type GuideSection } from "@/lib/guides";
import { SITE_NAME } from "@/lib/property-metadata";

const title = `Guías de tasación, compra y venta | ${SITE_NAME}`;
const description = "Respuestas claras sobre tasar, comprar y vender una propiedad en el Gran Concepción.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/guias" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_CL",
    url: "/guias",
    title,
    description,
    images: [BRAND_SHARE_IMAGE],
  },
};

const SECTION_ORDER: readonly GuideSection[] = ["tasacion-compra", "regularizacion"];

export default function GuidesPage() {
  const guides = listGuides({ includeDrafts: SHOW_DRAFT_GUIDES });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-ink">Guías</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>

      {SECTION_ORDER.map((section) => {
        const inSection = guides.filter((guide) => guide.section === section);
        if (inSection.length === 0) return null;
        return (
          <section key={section} aria-labelledby={`guides-${section}`} className="mt-12">
            <h2 id={`guides-${section}`} className="font-display text-3xl text-ink">
              {GUIDE_SECTIONS[section].title}
            </h2>
            <p className="mt-2 text-muted">{GUIDE_SECTIONS[section].description}</p>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {inSection.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={guidePath(guide.slug)}
                    className="group block py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <span className="block text-lg font-semibold text-ink group-hover:text-brass-text">{guide.title}</span>
                    <span className="mt-1 block text-muted">{guide.summary}</span>
                    {guide.status === "draft" && (
                      <span className="mt-2 inline-block rounded-full border border-line px-3 py-0.5 text-xs text-muted">
                        Borrador: solo visible fuera de producción
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
