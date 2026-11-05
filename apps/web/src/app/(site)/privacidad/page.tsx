import type { Metadata } from "next";
import { BRAND_SHARE_IMAGE } from "@/lib/brand-share-image";
import { CONTACT_EMAIL } from "@/lib/contact";
import { SITE_NAME } from "@/lib/property-metadata";


const title = `Política de privacidad | ${SITE_NAME}`;
const description = "Qué datos recoge PropiZoom, para qué los usa, quién los procesa y cómo ejercer tus derechos.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacidad" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_CL",
    url: "/privacidad",
    title,
    description,
    images: [BRAND_SHARE_IMAGE],
  },
};

const SECTIONS: readonly { heading: string; paragraphs: readonly string[] }[] = [
  {
    heading: "Quién es responsable",
    paragraphs: [
      `El responsable del tratamiento de tus datos es PropiZoom, corredora de propiedades del Gran Concepción. Puedes escribirnos a ${CONTACT_EMAIL}.`,
    ],
  },
  {
    heading: "Qué datos recogemos",
    paragraphs: [
      "Cuando pides una tasación o envías una consulta, guardamos tu nombre, teléfono, correo y los datos de la propiedad o del mensaje que nos entregas.",
      "Si creas una cuenta, guardamos además tu correo y una contraseña cifrada.",
      "Con Google Analytics medimos de forma agregada las visitas y dos acciones: enviar un formulario y pulsar el botón de WhatsApp.",
    ],
  },
  {
    heading: "Para qué los usamos",
    paragraphs: [
      "Para responder tu consulta, entregarte la tasación y contactarte por teléfono, correo o WhatsApp. Para mejorar el sitio, usamos las estadísticas de visitas. No vendemos tus datos.",
    ],
  },
  {
    heading: "Quién los procesa",
    paragraphs: [
      "Guardamos los datos en una base de datos alojada en Supabase. El correo de cada consulta se envía mediante Web3Forms. Las visitas se miden con Google Analytics. El sitio funciona sobre Vercel y las imágenes se sirven desde Cloudinary.",
    ],
  },
  {
    heading: "Tus derechos",
    paragraphs: [
      `Según la Ley N° 19.628 sobre protección de la vida privada, puedes pedir acceso, rectificación o eliminación de tus datos y oponerte a su uso. Escríbenos a ${CONTACT_EMAIL} y respondemos a la brevedad.`,
    ],
  },
  {
    heading: "Última actualización",
    paragraphs: ["Noviembre de 2026."],
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <h1 className="font-display text-4xl text-ink">Política de privacidad</h1>
      {SECTIONS.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="font-display text-2xl text-ink">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
