import { buildWhatsAppUrl } from "@/components/layout/whatsapp-button";

export type PropertyProblem = {
  id: string;
  label: string;
  /** What it means, in plain words. */
  meaning: string;
  /** Why it gets in the way of selling or buying. */
  blocks: string;
  /** The usual path, in order. General guidance, not legal advice. */
  steps: readonly [string, string, string];
};

export const PROPERTY_PROBLEMS: readonly PropertyProblem[] = [
  {
    id: "sin-escritura",
    label: "Sin escritura inscrita",
    meaning: "Compraste o te traspasaron la propiedad, pero la compraventa no quedó inscrita a tu nombre en el Conservador de Bienes Raíces.",
    blocks: "Quien compra y su banco piden que el vendedor figure como dueño en el Conservador. Sin eso, no hay venta ni crédito hipotecario.",
    steps: [
      "Reunir la escritura, los contratos y los pagos que respaldan la compra.",
      "Pedir el certificado de dominio vigente para ver a nombre de quién figura.",
      "Inscribir o regularizar el título con apoyo de un profesional.",
    ],
  },
  {
    id: "ampliacion-sin-permiso",
    label: "Ampliación sin permiso",
    meaning: "Se construyó o amplió la casa y esa obra no está en los planos aprobados por la municipalidad.",
    blocks: "Los metros reales no coinciden con los registrados: el avalúo, la tasación y la escritura no calzan con lo que se vende.",
    steps: [
      "Medir la obra y levantar planos de lo construido.",
      "Consultar en la Dirección de Obras de tu municipalidad qué vía de regularización aplica.",
      "Presentar los antecedentes y obtener la regularización.",
    ],
  },
  {
    id: "sin-recepcion-final",
    label: "Sin recepción final",
    meaning: "La construcción no tiene el certificado de recepción final de obras que otorga la Dirección de Obras Municipales.",
    blocks: "Sin recepción final la propiedad no está legalmente terminada, y muchos bancos no financian su compra.",
    steps: [
      "Pedir el expediente de la obra en la municipalidad.",
      "Corregir lo que impide la recepción, si hay algo pendiente.",
      "Solicitar la recepción final y guardar el certificado.",
    ],
  },
  {
    id: "herencia",
    label: "Herencia sin posesión efectiva",
    meaning: "El dueño falleció y la propiedad sigue inscrita a su nombre; los herederos aún no la tienen a su nombre.",
    blocks: "Los herederos no pueden vender hasta inscribir la posesión efectiva y luego la propiedad a su nombre.",
    steps: [
      "Tramitar la posesión efectiva de la herencia.",
      "Inscribirla en el Conservador de Bienes Raíces.",
      "Definir entre los herederos quién vende y cómo se reparte.",
    ],
  },
  {
    id: "deslindes",
    label: "Superficie o deslindes que no calzan",
    meaning: "Los metros del terreno o los límites con los vecinos no coinciden entre la escritura, el plano y lo que existe en el sitio.",
    blocks: "Cualquier diferencia genera dudas sobre qué se vende exactamente y puede frenar la escritura o generar conflictos con vecinos.",
    steps: [
      "Medir el terreno con un topógrafo y comparar con la escritura.",
      "Hablar con los vecinos si hay límites en disputa.",
      "Corregir los antecedentes que corresponda ante el Conservador o la municipalidad.",
    ],
  },
  {
    id: "gravamenes",
    label: "Hipotecas o gravámenes",
    meaning: "La propiedad tiene una hipoteca vigente, un embargo o una prohibición registrada en el Conservador.",
    blocks: "Un gravamen sin alzar viaja con la propiedad: quien compra lo hereda y el banco no financia.",
    steps: [
      "Pedir el certificado de hipotecas y gravámenes para ver qué hay inscrito.",
      "Pagar o negociar lo pendiente con el acreedor.",
      "Alzar el gravamen e inscribir el alzamiento.",
    ],
  },
] as const;

const GENERIC_MESSAGE = "Hola, tengo una propiedad con problemas y quiero asesoría para regularizarla.";

/** The WhatsApp text for a problem, or a generic one when none is chosen. */
export function buildRegularizationMessage(problem?: PropertyProblem): string {
  if (!problem) return GENERIC_MESSAGE;
  return `Hola, mi propiedad tiene este problema: ${problem.label.toLowerCase()}. Quiero asesoría para regularizarla.`;
}

/** `wa.me` link for the consultation, or `null` when the WhatsApp number is not configured. */
export function buildRegularizationUrl(rawNumber: string | undefined, problem?: PropertyProblem): string | null {
  return buildWhatsAppUrl(rawNumber, buildRegularizationMessage(problem));
}
