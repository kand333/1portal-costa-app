import Link from "next/link";

type MobileCtaBarProps = {
  /** Where the button leads; on `/vender` it jumps to the form instead of reloading the page. */
  href?: string;
};

/** Phones only: a «VENDE CON NOSOTROS» bar fixed to the bottom of the screen at all times. */
export function MobileCtaBar({ href = "/vender" }: MobileCtaBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <Link href={href} className="flex h-12 items-center justify-center rounded-full bg-accent font-bold text-on-accent shadow-soft">
        VENDE CON NOSOTROS
      </Link>
    </div>
  );
}
