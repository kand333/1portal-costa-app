import Image from "next/image";
import { AccentWord } from "@/components/ui/accent-word";
import { LeadForm } from "@/components/home/lead-form";

// Test photo (Unsplash). Swap it here for the real one.
const CLOSING_PHOTO = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80";

/** A split close: a brand-blue block with the lead form beside a photo and a sliding orange tile. */
export function CallToActionSection() {
  return (
    <section aria-labelledby="call-to-action-title" className="w-full">
      <div id="cierre" className="grid scroll-mt-24 lg:grid-cols-2">
        <div className="bg-brand-blue px-4 py-16 text-white sm:px-8 lg:px-12 lg:py-24 lg:pl-[max(3rem,calc((100vw-80rem)/2+2rem))]">
          <h2 id="call-to-action-title" className="font-display display-heavy text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.02]">
            Cuéntanos qué <AccentWord plain>necesitas</AccentWord>
          </h2>
          <div className="mt-8 max-w-lg rounded-[1.5rem] bg-surface p-5 text-ink sm:p-6">
            <LeadForm source="home-closing" idPrefix="closing-lead" />
          </div>
        </div>
        <div className="relative isolate min-h-[22rem] overflow-hidden lg:min-h-0">
          <Image src={CLOSING_PHOTO} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          <div
            aria-hidden="true"
            className="tile-slide absolute right-[10%] top-[12%] h-2/5 w-2/5 rounded-2xl bg-[image:var(--ember)] shadow-lift"
          />
        </div>
      </div>
    </section>
  );
}
