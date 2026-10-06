import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";
import { FlashMessages } from "@/components/ui/flash-messages";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

// Display face: only used at large sizes (titles, prices, brand), where its thin strokes hold up.
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  // Base for the relative URLs of the metadata (canonical, Open Graph).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Portal Inmobiliario",
  description: "Propiedades en venta y arriendo en Chile.",
  // Pages without their own Open Graph share these; a page that sets it replaces the whole object.
  openGraph: {
    type: "website",
    siteName: "Portal Inmobiliario",
    locale: "es_CL",
    title: "Portal Inmobiliario",
    description: "Propiedades en venta y arriendo en Chile.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1213" },
  ],
};

/** Shared document shell. The public site (`(site)`) and `/admin` each add their own chrome. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${hankenGrotesk.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <FlashMessages />
      </body>
    </html>
  );
}
