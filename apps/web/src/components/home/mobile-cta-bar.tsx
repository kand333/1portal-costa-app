"use client";

import { useEffect, useState } from "react";

/** Phones only: a fixed "Tasar gratis" bar that steps aside while a lead form is on screen. */
export function MobileCtaBar() {
  const [isFormVisible, setIsFormVisible] = useState(true);

  useEffect(() => {
    const forms = ["cierre"].flatMap((id) => document.getElementById(id) ?? []);
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setIsFormVisible(visible.size > 0);
    });
    forms.forEach((form) => observer.observe(form));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={isFormVisible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 lg:hidden ${
        isFormVisible ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <a
        href="#cierre"
        tabIndex={isFormVisible ? -1 : undefined}
        className="flex h-12 items-center justify-center rounded-full bg-accent font-semibold text-on-accent"
      >
        Cuéntanos qué necesitas
      </a>
    </div>
  );
}
