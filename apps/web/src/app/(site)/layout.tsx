import type { ReactNode } from "react";
import { GoogleAnalytics } from "@/components/layout/google-analytics";
import { SkipLink } from "@/components/layout/skip-link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { TopBar } from "@/components/layout/top-bar";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { UfValueProvider } from "@/components/properties/uf-value-context";
import { fetchUfValue } from "@/lib/uf-server";

/** Public site: header, content and footer. `/admin` has its own layout instead. */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const ufValue = await fetchUfValue();
  return (
    <UfValueProvider value={ufValue}>
      <SkipLink />
      <TopBar />
      <SiteHeader />
      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppButton />
      <GoogleAnalytics />
    </UfValueProvider>
  );
}
