export type GuideSection = "regularizacion" | "tasacion-compra";

/** One block of an article body. The renderer maps each kind to markup, so the content stays plain data. */
export type GuideBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: readonly string[] };

export type GuideSource = { label: string; url: string };

export type Guide = {
  slug: string;
  section: GuideSection;
  title: string;
  /** At most 155 characters: it is the meta description and the hub card text. */
  summary: string;
  /** Direct answer shown first. */
  answer: string;
  blocks: readonly GuideBlock[];
  sources: readonly GuideSource[];
  /** `YYYY-MM-DD` of the last review of the text. */
  reviewedOn: string;
  /**
   * `draft` guides are visible only outside production and stay out of the hub and the sitemap until the legal team
   * of the business has reviewed them.
   */
  status: "draft" | "published";
};

export const GUIDE_SECTIONS: Record<GuideSection, { title: string; description: string }> = {
  regularizacion: {
    title: "Regularización de propiedades",
    description: "Qué significa cada problema de papeles y cuál es el camino habitual para resolverlo.",
  },
  "tasacion-compra": {
    title: "Tasación, compra y venta",
    description: "Cómo valorar una propiedad y qué revisar antes de comprar, vender o arrendar.",
  },
};

const CHILEATIENDE_GP =
  "https://www.chileatiende.gob.cl/fichas/457-certificado-de-los-registros-de-hipotecas-gravamenes-y-prohibiciones-de-una-propiedad-gp";
const CHILEATIENDE_POSESION = "https://www.chileatiende.gob.cl/fichas/89474-inscripcion-de-posesion-efectiva";
const BCN_LEY_19903 = "https://www.bcn.cl/leychile/navegar?idLey=19903";
const BCN_LEY_20898 = "https://www.bcn.cl/leychile/navegar?i=1087285";
const MINVU_RECEPCION = "https://www.minvu.gob.cl/wp-content/uploads/2024/03/Formulario-14.3.-recepcion-definitiva.pdf";
const SII = "https://www.sii.cl/";

const GENERAL_NOTE =
  "Esta guía es orientación general y no reemplaza el análisis de tu caso. Los requisitos, plazos y costos cambian según la comuna y la fecha: confírmalos en el organismo indicado en las fuentes.";

export const GUIDES: readonly Guide[] = [
  {
    slug: "casa-sin-escritura-inscrita",
    section: "regularizacion",
    title: "Casa sin escritura inscrita: qué hacer antes de vender",
    summary: "Qué significa que la compraventa no esté inscrita en el Conservador de Bienes Raíces y por dónde empezar a regularizarlo.",
    answer:
      "Tener la escritura firmada no basta: el dominio de una propiedad figura a nombre de quien la tiene inscrita en el Conservador de Bienes Raíces de su comuna. Si tu compraventa nunca se inscribió, quien aparece como dueño sigue siendo el vendedor anterior, y eso frena una venta nueva y un crédito hipotecario.",
    blocks: [
      { kind: "heading", text: "Cómo saber si tu propiedad está inscrita a tu nombre" },
      {
        kind: "paragraph",
        text: "Pide en el Conservador de Bienes Raíces de la comuna donde está la propiedad el certificado de dominio vigente. Ahí figura el nombre del dueño inscrito y la fecha de la última inscripción. Si no eres tú, falta inscribir.",
      },
      { kind: "heading", text: "Qué documentos conviene reunir" },
      {
        kind: "list",
        items: [
          "La escritura de compraventa o el título con que tienes la propiedad.",
          "Comprobantes de pago y cualquier contrato o promesa previos.",
          "El rol de avalúo de la propiedad y el último avalúo fiscal.",
          "Tu cédula de identidad y, si corresponde, los datos del vendedor anterior.",
        ],
      },
      { kind: "heading", text: "El camino habitual" },
      {
        kind: "list",
        items: [
          "Revisar el estado real del dominio con el certificado del Conservador.",
          "Ordenar los documentos y detectar qué falta (por ejemplo, la inscripción o un título anterior).",
          "Pedir a un profesional que presente la inscripción o el procedimiento que corresponda a tu situación.",
        ],
      },
      { kind: "paragraph", text: GENERAL_NOTE },
    ],
    sources: [
      { label: "ChileAtiende: certificados de hipotecas, gravámenes y prohibiciones de una propiedad", url: CHILEATIENDE_GP },
      { label: "Servicio de Impuestos Internos: avalúo fiscal y rol de una propiedad", url: SII },
    ],
    reviewedOn: "2026-11-06",
    status: "draft",
  },
  {
    slug: "recepcion-final-de-obras",
    section: "regularizacion",
    title: "Recepción final de obras: qué es y por qué importa al vender",
    summary: "Qué certifica la recepción final de la Dirección de Obras Municipales y cómo afecta una venta o un crédito hipotecario.",
    answer:
      "La recepción final es el certificado de la Dirección de Obras Municipales (DOM) que constata que la construcción se hizo conforme al permiso aprobado. Sin ella, la propiedad no está legalmente terminada y muchos bancos no financian su compra.",
    blocks: [
      { kind: "heading", text: "Qué certifica" },
      {
        kind: "paragraph",
        text: "Que la obra ejecutada corresponde al permiso de edificación aprobado por la municipalidad. Si hay partes construidas que no estaban en ese permiso, quedan fuera de la recepción.",
      },
      { kind: "heading", text: "Por qué importa para vender" },
      {
        kind: "list",
        items: [
          "El comprador y su banco suelen pedir el certificado de recepción final.",
          "Las superficies sin recepción pueden no ser consideradas al tasar para un crédito.",
          "Resolverlo antes de publicar evita que la venta se detenga a mitad de camino.",
        ],
      },
      { kind: "heading", text: "El camino habitual" },
      {
        kind: "list",
        items: [
          "Pedir en la DOM de tu municipalidad el expediente de la obra y ver qué falta.",
          "Corregir lo pendiente con apoyo de un arquitecto o profesional competente, si lo hay.",
          "Solicitar la recepción final y guardar el certificado junto con los demás documentos de la propiedad.",
        ],
      },
      { kind: "paragraph", text: GENERAL_NOTE },
    ],
    sources: [
      { label: "MINVU: formulario de recepción definitiva de obras", url: MINVU_RECEPCION },
      { label: "BCN LeyChile: Ley 20.898, regularización de viviendas", url: BCN_LEY_20898 },
    ],
    reviewedOn: "2026-11-06",
    status: "draft",
  },
  {
    slug: "ampliacion-sin-permiso",
    section: "regularizacion",
    title: "Ampliación sin permiso: opciones para regularizar",
    summary: "Qué pasa cuando la casa fue ampliada sin permiso municipal y qué vías suelen evaluarse antes de venderla.",
    answer:
      "Si ampliaste la casa sin permiso, la superficie real no coincide con la registrada en la municipalidad. Existen vías de regularización, y cuál aplica depende de la antigüedad, el tamaño y el tipo de la obra: la Dirección de Obras Municipales de tu comuna es quien las evalúa.",
    blocks: [
      { kind: "heading", text: "Por qué es un problema al vender" },
      {
        kind: "paragraph",
        text: "La escritura, el avalúo y la tasación se apoyan en los metros registrados. Si los metros reales son otros, el comprador, el banco o el tasador pueden objetar la operación.",
      },
      { kind: "heading", text: "Qué suele pedirse" },
      {
        kind: "list",
        items: [
          "Levantamiento de planos de lo realmente construido, hecho por un profesional.",
          "Antecedentes de la propiedad: escritura, rol y permisos anteriores.",
          "Una solicitud ante la DOM, que evalúa si la obra cumple las normas y por qué vía puede regularizarse.",
        ],
      },
      { kind: "heading", text: "Una ley pensada para estos casos" },
      {
        kind: "paragraph",
        text: "La Ley 20.898 estableció un procedimiento simplificado para regularizar ciertas viviendas y ampliaciones. Sus requisitos y plazos han sido modificados; revisa el texto vigente antes de asumir que tu caso entra.",
      },
      { kind: "paragraph", text: GENERAL_NOTE },
    ],
    sources: [{ label: "BCN LeyChile: Ley 20.898, regularización de viviendas", url: BCN_LEY_20898 }],
    reviewedOn: "2026-11-06",
    status: "draft",
  },
  {
    slug: "herencia-y-posesion-efectiva",
    section: "regularizacion",
    title: "Herencia y posesión efectiva: cómo dejar la propiedad a nombre de los herederos",
    summary: "Qué es la posesión efectiva y los pasos habituales para inscribir una propiedad heredada y poder venderla.",
    answer:
      "Cuando el dueño fallece, la propiedad sigue inscrita a su nombre. Para que los herederos puedan venderla hay que tramitar la posesión efectiva y luego inscribirla en el Conservador de Bienes Raíces.",
    blocks: [
      { kind: "heading", text: "Dos etapas" },
      {
        kind: "list",
        items: [
          "Posesión efectiva: reconoce quiénes son los herederos. Si no hay testamento, se tramita ante el Servicio de Registro Civil e Identificación; si hay testamento, el camino es distinto.",
          "Inscripción en el Conservador de Bienes Raíces: con la resolución de posesión efectiva se inscribe la propiedad a nombre de los herederos.",
        ],
      },
      { kind: "heading", text: "Qué se necesita saber" },
      {
        kind: "list",
        items: [
          "Si existe o no testamento, porque cambia la vía.",
          "El rol, la comuna y el avalúo fiscal de la propiedad.",
          "Quiénes son todos los herederos: para vender, deben decidir juntos cómo hacerlo y cómo repartir.",
        ],
      },
      { kind: "paragraph", text: GENERAL_NOTE },
    ],
    sources: [
      { label: "ChileAtiende: inscripción de posesión efectiva", url: CHILEATIENDE_POSESION },
      { label: "BCN LeyChile: Ley 19.903, posesión efectiva", url: BCN_LEY_19903 },
    ],
    reviewedOn: "2026-11-06",
    status: "draft",
  },
  {
    slug: "cuanto-cuesta-una-tasacion",
    section: "tasacion-compra",
    title: "¿Cuánto cuesta una tasación en Concepción?",
    summary: "Tipos de tasación (online, comercial y bancaria), de qué depende el costo y cuándo conviene cada una.",
    answer:
      "El costo depende del tipo de tasación. La estimación online que ofrece PropiZoom es gratuita y orientativa. Una tasación bancaria, que exige el banco para un crédito hipotecario, la hace un tasador y su valor lo fija cada institución.",
    blocks: [
      { kind: "heading", text: "Tres tipos, tres usos" },
      {
        kind: "list",
        items: [
          "Estimación online: compara tu propiedad con las publicadas y entrega un precio y un rango. Sirve para orientarte antes de vender, comprar o arrendar.",
          "Tasación comercial: un corredor o tasador revisa la propiedad y su entorno para recomendar un precio de publicación.",
          "Tasación bancaria: la pide el banco al financiar una compra; el resultado define cuánto está dispuesto a prestar.",
        ],
      },
      { kind: "heading", text: "De qué depende el costo" },
      {
        kind: "list",
        items: [
          "Quién la solicita y para qué (venta, crédito, herencia, seguros).",
          "El tipo y el tamaño de la propiedad.",
          "Si requiere visita presencial y informe formal.",
        ],
      },
      {
        kind: "paragraph",
        text: "Para saber el valor exacto de una tasación formal, consulta directamente al tasador o al banco: no publicamos cifras porque cambian según la institución y la propiedad.",
      },
    ],
    sources: [{ label: "Servicio de Impuestos Internos: avalúo fiscal de una propiedad", url: SII }],
    reviewedOn: "2026-11-06",
    status: "published",
  },
  {
    slug: "como-saber-cuanto-vale-tu-propiedad",
    section: "tasacion-compra",
    title: "Cómo saber cuánto vale tu casa o departamento",
    summary: "Qué factores mueven el precio de una propiedad y cómo obtener una referencia realista antes de publicarla.",
    answer:
      "El valor de una propiedad se acerca más al precio real cuando se compara con propiedades parecidas que hoy se ofrecen en la misma zona. El avalúo fiscal del SII es otra cosa: sirve para impuestos y no equivale al precio de venta.",
    blocks: [
      { kind: "heading", text: "Qué mueve el precio" },
      {
        kind: "list",
        items: [
          "La ubicación y el sector dentro de la comuna.",
          "La superficie construida y la del terreno o del departamento.",
          "Dormitorios, baños, estacionamientos y bodega.",
          "La antigüedad y el estado de conservación.",
          "Que los papeles estén en regla: inscripción, recepción final y superficies que calcen.",
        ],
      },
      { kind: "heading", text: "Cómo obtener una referencia" },
      {
        kind: "list",
        items: [
          "Usar un tasador online que compare con propiedades publicadas.",
          "Mirar avisos de propiedades parecidas en tu zona y comparar lo que ofrecen.",
          "Pedir a una corredora que revise la propiedad en persona y te proponga un precio de publicación.",
        ],
      },
      {
        kind: "paragraph",
        text: "Una estimación es referencial: el precio final se define al negociar y depende del estado real y del momento del mercado.",
      },
    ],
    sources: [{ label: "Servicio de Impuestos Internos: avalúo fiscal de una propiedad", url: SII }],
    reviewedOn: "2026-11-06",
    status: "published",
  },
  {
    slug: "que-revisar-al-comprar-un-proyecto-nuevo",
    section: "tasacion-compra",
    title: "Qué revisar al comprar un proyecto nuevo",
    summary: "Lista corta de lo que conviene pedir y verificar antes de reservar un departamento o casa en un proyecto nuevo.",
    answer:
      "Antes de reservar, pide por escrito lo que prometen y verifica que el proyecto tenga sus permisos y que la inmobiliaria sea quien dice ser. Compara las condiciones de entrega y de pago, y lee el contrato completo antes de firmar.",
    blocks: [
      { kind: "heading", text: "Lo que conviene pedir" },
      {
        kind: "list",
        items: [
          "Permiso de edificación y estado de avance de la obra.",
          "Planos y superficie de la unidad, y qué incluye (estacionamiento, bodega).",
          "Fecha de entrega comprometida y qué pasa si se atrasa.",
          "Forma de pago, reserva y condiciones si desistes.",
          "Quién financia el proyecto y cómo funciona la escrituración.",
        ],
      },
      { kind: "heading", text: "Antes de firmar" },
      {
        kind: "list",
        items: [
          "Leer el contrato de promesa completo, no solo el resumen.",
          "Confirmar con tu banco las condiciones del crédito para esa propiedad.",
          "Si algo no está claro, consultarlo con un abogado antes de firmar.",
        ],
      },
      { kind: "paragraph", text: "Una corredora puede ayudarte a comparar proyectos y a ordenar estas preguntas antes de reservar." },
    ],
    sources: [{ label: "ChileAtiende: certificados de hipotecas y gravámenes de una propiedad", url: CHILEATIENDE_GP }],
    reviewedOn: "2026-11-06",
    status: "published",
  },
  {
    slug: "vender-o-arrendar-como-decidir",
    section: "tasacion-compra",
    title: "Vender o arrendar tu propiedad: cómo decidir",
    summary: "Preguntas para decidir entre vender y arrendar: necesidad de liquidez, costos de mantención y estado de los papeles.",
    answer:
      "Vender entrega liquidez de una vez; arrendar entrega un ingreso mensual y conserva la propiedad. Conviene decidir mirando para qué necesitas el dinero, cuánto cuesta mantener la propiedad y si sus papeles están al día.",
    blocks: [
      { kind: "heading", text: "Preguntas para decidir" },
      {
        kind: "list",
        items: [
          "¿Necesitas el dinero ahora o un ingreso mensual?",
          "¿Cuánto cuestan al año los gastos de la propiedad (contribuciones, gastos comunes, mantención)?",
          "¿Quieres conservarla como inversión a largo plazo?",
          "¿Tiene papeles pendientes que haya que resolver antes de cualquier operación?",
        ],
      },
      { kind: "heading", text: "Cómo obtener números" },
      {
        kind: "paragraph",
        text: "Con un tasador puedes ver el precio de venta y el de arriendo de tu propiedad y comparar. Después, una corredora puede revisar contigo el escenario que más te acomode.",
      },
    ],
    sources: [{ label: "Servicio de Impuestos Internos: contribuciones y avalúo", url: SII }],
    reviewedOn: "2026-11-06",
    status: "published",
  },
];

/** Guides to show: published ones, plus drafts only when `includeDrafts` is set (never in production). */
export function listGuides({ includeDrafts = false }: { includeDrafts?: boolean } = {}): Guide[] {
  return GUIDES.filter((guide) => includeDrafts || guide.status === "published");
}

export function getGuide(slug: string, { includeDrafts = false }: { includeDrafts?: boolean } = {}): Guide | null {
  return listGuides({ includeDrafts }).find((guide) => guide.slug === slug) ?? null;
}

/** Drafts can be previewed outside production only. */
export const SHOW_DRAFT_GUIDES = process.env.NODE_ENV !== "production";

export function guidePath(slug: string): string {
  return `/guias/${slug}`;
}
