import Script from "next/script";
import { getMeasurementId } from "@/lib/analytics";
import { WhatsAppClickTracker } from "./whatsapp-click-tracker";

/** Loads GA4 on the public site only while `NEXT_PUBLIC_GA_MEASUREMENT_ID` is a valid id; otherwise renders nothing. */
export function GoogleAnalytics({ measurementId = getMeasurementId() }: { measurementId?: string | null }) {
  if (measurementId === null) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}');`}
      </Script>
      <WhatsAppClickTracker />
    </>
  );
}
