import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedGuides } from "@/components/guides/related-guides";
import { serializeJsonLd } from "@/lib/agent-schema";
import { BRAND_SHARE_IMAGE } from "@/lib/brand-share-image";
import { getGuide, GUIDE_SECTIONS, guidePath, listGuides, SHOW_DRAFT_GUIDES } from "@/lib/guides";
import { SITE_NAME } from "@/lib/property-metadata";
import { siteUrl } from "@/lib/site-url";

// Only the listed guides exist (drafts only outside production); anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return listGuides({ includeDrafts: SHOW_DRAFT_GUIDES }).map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug, { includeDrafts: SHOW_DRAFT_GUIDES });
  if (!guide) return { title: `Página no encontrada | ${SITE_NAME}` };
  const title = `${guide.title} | ${SITE_NAME}`;
  return {
    title,
    description: guide.summary,
    alternates: { canonical: guidePath(guide.slug) },
    robots: guide.status === "draft" ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "es_CL",
      url: guidePath(guide.slug),
      title,
      description: guide.summary,
      images: [BRAND_SHARE_IMAGE],
    },
  };
}

const ctaClassName =
  "inline-flex h-12 items-center rounded-full bg-accent px-7 font-bold text-on-accent shadow-soft transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-accent-hover";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function GuidePage({ params }: PageProps<"/guias/[slug]">) {
  const { slug } = await params;
  const guide = getGuide(slug, { includeDrafts: SHOW_DRAFT_GUIDES });
  if (!guide) notFound();

  const origin = siteUrl();
  const url = `${origin}${guidePath(guide.slug)}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.summary,
      dateModified: guide.reviewedOn,
      inLanguage: "es-CL",
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: SITE_NAME, url: origin },
      publisher: { "@type": "Organization", name: SITE_NAME, url: origin, logo: { "@type": "ImageObject", url: `${origin}/logo-mark.png` } },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: origin },
        { "@type": "ListItem", position: 2, name: "Guías", item: `${origin}/guias` },
        { "@type": "ListItem", position: 3, name: guide.title, item: url },
      ],
    },
  ];
  const isRegularization = guide.section === "regularizacion";

  return (
    <>
      {jsonLd.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          // Static data from this repository, with "<" escaped so it cannot close the tag.
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(entry) }}
        />
      ))}
      <article className="mx-auto w-full max-w-3xl px-4 pb-12 pt-10 sm:px-6">
        <nav aria-label="Ruta de navegación" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-ink">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/guias" className="hover:text-ink">
                Guías
              </Link>
            </li>
          </ol>
        </nav>

        <p className="mt-6 text-sm text-muted">{GUIDE_SECTIONS[guide.section].title}</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.08] text-ink">{guide.title}</h1>
        <p className="mt-3 text-sm text-muted">
          Última revisión: <time dateTime={guide.reviewedOn}>{dateFormatter.format(new Date(`${guide.reviewedOn}T00:00:00Z`))}</time>
        </p>
        {guide.status === "draft" && (
          <p role="note" className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
            Borrador: no se publica en producción hasta que el equipo jurídico lo revise.
          </p>
        )}

        <p className="mt-8 text-xl leading-relaxed text-ink">{guide.answer}</p>

        <div className="mt-6 space-y-4">
          {guide.blocks.map((block, index) => {
            if (block.kind === "heading") {
              return (
                <h2 key={index} className="pt-6 text-2xl font-semibold text-ink">
                  {block.text}
                </h2>
              );
            }
            if (block.kind === "list") {
              return (
                <ul key={index} className="list-disc space-y-2 pl-5 leading-relaxed text-muted">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={index} className="leading-relaxed text-muted">
                {block.text}
              </p>
            );
          })}
        </div>

        <aside className="mt-12 rounded-[1.75rem] border border-line bg-surface p-6">
          <h2 className="font-display text-2xl text-ink">
            {isRegularization ? "¿Quieres revisar tu caso?" : "¿Quieres saber cuánto vale tu propiedad?"}
          </h2>
          <p className="mt-2 text-muted">
            {isRegularization
              ? "Cuéntanos qué le pasa a tu propiedad y te orientamos sobre el camino."
              : "Usa el tasador gratuito y obtén un precio y un rango en segundos."}
          </p>
          <div className="mt-5">
            <Link href={isRegularization ? "/regularizacion" : "/tasador-propiedades"} className={ctaClassName}>
              {isRegularization ? "Ver regularización" : "Tasar gratis"}
            </Link>
          </div>
        </aside>

        <section aria-labelledby="guide-sources" className="mt-12">
          <h2 id="guide-sources" className="text-lg font-semibold text-ink">
            Fuentes
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {guide.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-brass-text underline underline-offset-4">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </article>

      <RelatedGuides
        sections={[guide.section, isRegularization ? "tasacion-compra" : "regularizacion"]}
        excludeSlug={guide.slug}
        className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6"
      />
    </>
  );
}
