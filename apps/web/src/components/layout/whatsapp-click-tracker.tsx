"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/** Sends a `whatsapp_click` event for any click on a WhatsApp link, wherever it is on the page. */
export function WhatsAppClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href^='https://wa.me/']") : null;
      if (link) trackEvent("whatsapp_click", { link_location: window.location.pathname });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
