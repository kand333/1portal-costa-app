import Link from "next/link";
import { guidePath, listGuides, SHOW_DRAFT_GUIDES, type Guide, type GuideSection } from "@/lib/guides";

type RelatedGuidesProps = {
  /** Sections to draw from, in order of preference. */
  sections: readonly GuideSection[];
  /** A guide to leave out (the one being read). */
  excludeSlug?: string;
  limit?: number;
  className?: string;
};

/** Up to `limit` guide links, drawn from the preferred sections. Renders nothing when there are none. */
export function RelatedGuides({ sections, excludeSlug, limit = 3, className }: RelatedGuidesProps) {
  const available = listGuides({ includeDrafts: SHOW_DRAFT_GUIDES }).filter((guide) => guide.slug !== excludeSlug);
  const picked: Guide[] = [];
  for (const section of sections) {
    for (const guide of available) {
      if (guide.section === section && !picked.includes(guide)) picked.push(guide);
    }
  }
  const guides = picked.slice(0, limit);
  if (guides.length === 0) return null;

  return (
    <nav aria-label="Guías relacionadas" className={className}>
      <h2 className="text-lg font-semibold text-ink">Guías relacionadas</h2>
      <ul className="mt-3 space-y-2">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link href={guidePath(guide.slug)} className="font-medium text-brass-text underline underline-offset-4">
              {guide.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
