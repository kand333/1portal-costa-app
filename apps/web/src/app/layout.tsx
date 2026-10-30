import type { Metadata, Viewport } from "next";
import { Geist_Mono, Hanken_Grotesk, Newsreader } from "next/font/google";
import { FlashMessages } from "@/components/ui/flash-messages";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

// Display face: a high-contrast serif (stand-in for the reference video's headline face) for titles, prices and brand.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
});

// Small uppercase labels ("PASO 1", "[ PROPIEDADES ]").
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Base for the relative URLs of the metadata (canonical, Open Graph).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "PropiZoom",
  description: "Corredora de propiedades en el Gran Concepción: proyectos nuevos, tasación y corretaje.",
  // Pages without their own Open Graph share these; a page that sets it replaces the whole object.
  openGraph: {
    type: "website",
    siteName: "PropiZoom",
    locale: "es_CL",
    title: "PropiZoom",
    description: "Corredora de propiedades en el Gran Concepción: proyectos nuevos, tasación y corretaje.",
  },
};

export const viewport: Viewport = {
  themeColor: "#fef7e5",
  viewportFit: "cover",
};

/** Shared document shell. The public site (`(site)`) and `/admin` each add their own chrome. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${hankenGrotesk.variable} ${newsreader.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <FlashMessages />
      </body>
    </html>
  );
}
