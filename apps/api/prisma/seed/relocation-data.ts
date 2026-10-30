import { centerSectorOf } from "@portal/shared/locations";

/**
 * Sample listings for the Biobío, written for the 21 properties of the development snapshot:
 * every property keeps its id, type, operation, photos, favorites and inquiries, and gets a
 * location from the catalog filters (region, city and sector), a title and description that fit
 * its photos and sector, local prices in CLP and complete details. 13 of the 19 published ones
 * (about 70 %) sit in Concepción, in different sectors, with copy that stresses the appreciation
 * potential (plusvalía) of the sector; the other 6 are spread over other cities. They are demo
 * data: a real broker must review them before publishing, and none of the copy promises a return.
 */
export type Relocation = {
  id: string;
  title: string;
  description: string;
  address: string;
  region: string;
  city: string;
  /** The sector (stored in the `commune` column). */
  commune: string;
  price: number;
  usableArea: number | null;
  totalArea: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  ageInYears: number | null;
  isFeatured: boolean;
  /** Names from the feature catalog. */
  features: string[];
};

const BIOBIO = "Región del Biobío";
const ARAUCO = "Provincia Arauco";

export const RELOCATIONS: Relocation[] = [
  // ------------------------------------------------------------------ Concepción (13 published)
  {
    id: "5eed0000-0000-4000-8000-000000000001",
    title: "Casa de 5 dormitorios en Lomas de San Sebastián, sector en alza",
    description:
      "Amplia casa de 320 m² sobre 650 m² de terreno en Lomas de San Sebastián, uno de los sectores residenciales de mayor crecimiento de Concepción, con condominios, comercio y servicios en expansión. Su perfil moderno y la cercanía a los centros comerciales sostienen la demanda y la valorización de las viviendas de la zona, por lo que es una compra familiar con alto potencial de plusvalía. Techos a dos aguas, grandes ventanales, jardín arbolado, 5 dormitorios, 4 baños, calefacción, quincho y 3 estacionamientos.",
    address: "Pasaje Los Nogales 1240, Lomas de San Sebastián, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Lomas de San Sebastián",
    price: 385_000_000,
    usableArea: 320,
    totalArea: 650,
    bedrooms: 5,
    bathrooms: 4,
    parkingSpaces: 3,
    ageInYears: 8,
    isFeatured: true,
    features: ["Jardín", "Terraza", "Calefacción", "Seguridad", "Quincho", "Lavandería"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000002",
    title: "Departamento en el Centro de Concepción: ubicación que se valoriza",
    description:
      "Departamento de 68 m² en el corazón administrativo, comercial y financiero de Concepción, a pasos de la Plaza de la Independencia, bancos, servicios y transporte. El casco histórico concentra empleo y demanda de arriendo todo el año y casi no tiene suelo nuevo, dos razones por las que las propiedades céntricas conservan su valor y tienen un alto potencial de plusvalía. Cocina abierta equipada, living luminoso, 2 dormitorios, 2 baños, estacionamiento, bodega, ascensor y conserjería. Ideal para vivir sin auto o como inversión de renta.",
    address: "Barros Arana 1050, Centro de Concepción, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Centro de Concepción",
    price: 128_000_000,
    usableArea: 68,
    totalArea: 75,
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    ageInYears: 5,
    isFeatured: true,
    features: ["Ascensor", "Conserjería", "Bodega", "Calefacción"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000003",
    title: "Departamento familiar en arriendo en Pedro de Valdivia, sector consolidado",
    description:
      "Departamento de 95 m² en Pedro de Valdivia, histórico sector residencial junto al río Biobío y al Cerro Caracol, con avenidas arboladas y una de las valorizaciones más estables de la ciudad y con buen potencial de plusvalía. La escasez de buenas viviendas en este barrio mantiene una demanda constante de arriendo y respalda el valor del edificio en el tiempo. Living comedor con ventanales, cocina independiente, 3 dormitorios, 2 baños, 2 estacionamientos, bodega, ascensor y conserjería; se aceptan mascotas.",
    address: "Av. Pedro de Valdivia 1220, Pedro de Valdivia, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Pedro de Valdivia",
    price: 780_000,
    usableArea: 95,
    totalArea: 105,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 2,
    ageInYears: 10,
    isFeatured: true,
    features: ["Ascensor", "Conserjería", "Calefacción", "Pet friendly", "Bodega"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000004",
    title: "Estudio en arriendo junto a la universidad, demanda asegurada por el barrio",
    description:
      "Estudio de 32 m² en el Barrio Universitario, el entorno de la Universidad de Concepción, epicentro cultural y estudiantil conectado con Parque Ecuador y el Cerro Caracol. Miles de estudiantes, académicos y profesionales sostienen allí una demanda permanente de arriendo y un valor de propiedad que se mantiene firme: un activo de baja vacancia y buen potencial de plusvalía. Luminoso y bien aprovechado, con zona de estar, kitchenette, baño completo, calefacción, ascensor y mobiliario básico.",
    address: "Chacabuco 640, Barrio Universitario, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Barrio Universitario",
    price: 330_000,
    usableArea: 32,
    totalArea: 35,
    bedrooms: 1,
    bathrooms: 1,
    parkingSpaces: 0,
    ageInYears: 3,
    isFeatured: false,
    features: ["Amoblado", "Calefacción", "Ascensor", "Pet friendly"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000005",
    title: "Casa moderna con jardín en Lorenzo Arenas, barrio con buena proyección",
    description:
      "Casa moderna de 140 m² sobre 280 m² de terreno en Lorenzo Arenas, tradicional sector residencial del poniente de Concepción, con comercio, servicios y conectividad que se han ido consolidando. Las propiedades nuevas en barrios con identidad y buen acceso, como este, suelen valorizarse con el tiempo: una oportunidad para comprar con visión de plusvalía. Líneas rectas, ventanales hacia el jardín, 4 dormitorios, 3 baños, estar familiar, quincho, 2 estacionamientos y una antigüedad de solo 3 años.",
    address: "Av. Lorenzo Arenas 450, Lorenzo Arenas, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Lorenzo Arenas",
    price: 175_000_000,
    usableArea: 140,
    totalArea: 280,
    bedrooms: 4,
    bathrooms: 3,
    parkingSpaces: 2,
    ageInYears: 3,
    isFeatured: false,
    features: ["Jardín", "Quincho", "Calefacción", "Lavandería", "Terraza"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000006",
    title: "Oficina tipo loft en Collao, polo comercial del oriente",
    description:
      "Oficina de 180 m² estilo loft en Collao, el gran sector residencial y comercial del oriente de Concepción, junto al Terminal de Buses, el Estadio Ester Roa Rebolledo y colegios, con excelente conectividad. Un eje con flujo constante de personas y servicios que sigue fortaleciéndose y respalda tanto el arriendo como la plusvalía del inmueble a largo plazo. Planta libre con ventanales de piso a techo, cielos altos, sala de reuniones, 2 baños, 4 estacionamientos, aire acondicionado, ascensor, conserjería y seguridad.",
    address: "Av. Collao 1500, Collao, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Collao",
    price: 1_450_000,
    usableArea: 180,
    totalArea: 180,
    bedrooms: null,
    bathrooms: 2,
    parkingSpaces: 4,
    ageInYears: 12,
    isFeatured: false,
    features: ["Aire acondicionado", "Seguridad", "Ascensor", "Conserjería"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000007",
    title: "Oficina en venta en Barrio Norte, renta y plusvalía en un sector consolidado",
    description:
      "Oficina de 75 m² en Barrio Norte, extenso sector al norte del centro con identidad histórica, comercio local y alta densidad habitacional: una clientela de barrio que no depende de las modas. Esa demanda estable y la escasez de oficinas bien ubicadas respaldan el valor del inmueble y su potencial de plusvalía, además de una renta de arriendo constante. Planta abierta con pasillo de circulación, zona de trabajo y archivo, baño, estacionamiento, ascensor, aire acondicionado y seguridad.",
    address: "Av. Paicaví 2650, Barrio Norte, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Barrio Norte",
    price: 98_000_000,
    usableArea: 75,
    totalArea: 75,
    bedrooms: null,
    bathrooms: 1,
    parkingSpaces: 1,
    ageInYears: 15,
    isFeatured: false,
    features: ["Aire acondicionado", "Ascensor", "Seguridad"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000011",
    title: "Departamento nuevo en Torreones: estrena en el sector de mayor desarrollo",
    description:
      "Departamento nuevo de 110 m² en Torreones (Bellavista), sector residencial en pleno desarrollo con proyectos inmobiliarios, condominios y viviendas familiares. Comprar al inicio de la consolidación de un barrio es la forma más habitual de capturar plusvalía: a medida que llegan comercio, servicios y nuevos vecinos, la zona gana valor. Cocina equipada con isla, living comedor luminoso, 3 dormitorios, 2 baños, terraza, bodega, 2 estacionamientos, ascensor, conserjería y seguridad. Una inversión para vivir o para arrendar.",
    address: "Calle Los Tilos 340, Torreones, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Torreones",
    price: 185_000_000,
    usableArea: 110,
    totalArea: 135,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 2,
    ageInYears: 2,
    isFeatured: true,
    features: ["Terraza", "Bodega", "Ascensor", "Conserjería", "Seguridad", "Calefacción"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000017",
    title: "Casa de dos pisos en Santa Sabina, primera vivienda con potencial de valorización",
    description:
      "Casa de 95 m² en un terreno de 160 m² en Santa Sabina, sector residencial al norte de Concepción con viviendas, equipamiento y servicios cercanos que siguen creciendo. Es una de las puertas de entrada más accesibles a la propiedad en la ciudad, en un barrio consolidado donde el precio por metro cuadrado se apoya en la demanda de familias, lo que le da buen potencial de plusvalía. Dos pisos con techo a dos aguas, 3 dormitorios, 2 baños, cocina y comedor independientes, patio, calefacción y estacionamiento.",
    address: "Calle Los Aromos 890, Santa Sabina, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Santa Sabina",
    price: 118_000_000,
    usableArea: 95,
    totalArea: 160,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 1,
    ageInYears: 18,
    isFeatured: false,
    features: ["Jardín", "Calefacción", "Lavandería"],
  },
  {
    id: "01a105bb-01a1-70ea-8ab5-59787ef4e938",
    title: "Casa de campo en el Valle de Nonguén, a minutos del centro y con alta proyección",
    description:
      "Casa de arquitectura contemporánea en madera y vidrio, de 340 m² sobre un terreno de 3.200 m² en el Valle de Nonguén, área residencial y natural del oriente de Concepción. Tener un terreno amplio, con vistas despejadas y a minutos de la ciudad, es cada vez más escaso, y esa escasez es lo que impulsa la plusvalía de los sectores de transición como este. Ventanales hacia el valle, terraza de madera, quincho, 4 dormitorios, 2 baños, calefacción y estacionamiento para 4 vehículos.",
    address: "Camino Valle de Nonguén km 6, Nonguén, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Nonguén",
    price: 260_000_000,
    usableArea: 340,
    totalArea: 3200,
    bedrooms: 4,
    bathrooms: 2,
    parkingSpaces: 4,
    ageInYears: 6,
    isFeatured: false,
    features: ["Terraza", "Jardín", "Calefacción", "Quincho", "Vista panoramica naturalesa privilegiada"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000008",
    title: "Terreno de 5.000 m² en Valle Andalién, suelo de expansión residencial",
    description:
      "Terreno plano de 5.000 m² en Valle Andalién, sector de expansión residencial hacia el norte de Concepción. Los terrenos en zonas donde la ciudad crece son los que más se valorizan cuando llegan los proyectos, el comercio y los servicios: comprar suelo antes de la consolidación es una de las estrategias clásicas de plusvalía. Topografía despejada, buen acceso por camino y superficie para un proyecto de viviendas, parcelas de agrado o una casa grande con jardín. Consulta por factibilidad de agua y electricidad.",
    address: "Camino a Penco, Valle Andalién, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Valle Andalién",
    price: 135_000_000,
    usableArea: null,
    totalArea: 5000,
    bedrooms: null,
    bathrooms: null,
    parkingSpaces: null,
    ageInYears: null,
    isFeatured: false,
    features: ["Vista panoramica naturalesa privilegiada"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000015",
    title: "Departamento junto a la Laguna Redonda, entorno consolidado y valorizado",
    description:
      "Departamento de 58 m² en Laguna Redonda, sector residencial consolidado alrededor de la laguna, con entorno verde, servicios cercanos y una demanda estable de arrendatarios y compradores. Los barrios con un atractivo natural propio mantienen su valor y tienden a ganar plusvalía con el tiempo, lo que lo hace una buena opción tanto para vivir como para invertir. Living comedor luminoso con sillones incluidos, cocina equipada, 2 dormitorios, 2 baños, estacionamiento, terraza, ascensor y calefacción.",
    address: "Calle Pinares 540, Laguna Redonda, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Laguna Redonda",
    price: 98_000_000,
    usableArea: 58,
    totalArea: 66,
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    ageInYears: 4,
    isFeatured: false,
    features: ["Ascensor", "Terraza", "Calefacción"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000016",
    title: "Departamento de categoría en arriendo en Valle Noble, desarrollo inmobiliario en alza",
    description:
      "Departamento minimalista de 150 m² en Valle Noble, sector de desarrollo inmobiliario residencial con conjuntos habitacionales y áreas verdes. Los sectores planificados y en crecimiento atraen a familias y profesionales y sostienen el valor de las propiedades, con un potencial de plusvalía que se fortalece cada año con nuevos proyectos. Espacios amplios y luminosos, terminaciones de categoría, 3 dormitorios, 3 baños, cocina equipada, 2 estacionamientos, bodega, aire acondicionado, ascensor, conserjería y seguridad.",
    address: "Av. Valle Noble 1500, Valle Noble, Concepción",
    region: BIOBIO,
    city: "Concepción",
    commune: "Valle Noble",
    price: 1_050_000,
    usableArea: 150,
    totalArea: 170,
    bedrooms: 3,
    bathrooms: 3,
    parkingSpaces: 2,
    ageInYears: 6,
    isFeatured: true,
    features: ["Ascensor", "Conserjería", "Seguridad", "Aire acondicionado", "Calefacción", "Bodega"],
  },

  // ------------------------------------------------------------------ Other cities (6 published)
  {
    id: "5eed0000-0000-4000-8000-000000000013",
    title: "Casa moderna en condominio en San Pedro de la Paz",
    description:
      "Casa moderna de 160 m² en condominio cerrado de San Pedro de la Paz, comuna de lagunas y barrios familiares junto al Biobío. Fachada de líneas contemporáneas, grandes ventanales al jardín, 4 dormitorios, 3 baños, quincho y 2 estacionamientos. El condominio cuenta con seguridad y áreas verdes. Una excelente alternativa para familias que buscan tranquilidad, seguridad y buena conectividad con Concepción.",
    address: "Condominio Los Pinos, Av. Michimalonco 1500, San Pedro de la Paz",
    region: BIOBIO,
    city: "San Pedro de la Paz",
    commune: centerSectorOf("San Pedro de la Paz"),
    price: 215_000_000,
    usableArea: 160,
    totalArea: 350,
    bedrooms: 4,
    bathrooms: 3,
    parkingSpaces: 2,
    ageInYears: 7,
    isFeatured: false,
    features: ["Jardín", "Quincho", "Seguridad", "Calefacción", "Pet friendly", "Terraza"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000010",
    title: "Casa familiar con jardín en arriendo en Talcahuano",
    description:
      "Casa de 210 m² con jardín en Talcahuano, ciudad puerto frente a la bahía de Concepción. Living comedor amplio, cocina independiente, 4 dormitorios, 3 baños, quincho y estacionamiento para 2 autos. Sector residencial con comercio, colegios y locomoción cerca. Ideal para una familia o una empresa que necesita alojar a su personal cerca del puerto y de las zonas industriales.",
    address: "Av. Colón 2400, Talcahuano",
    region: BIOBIO,
    city: "Talcahuano",
    commune: centerSectorOf("Talcahuano"),
    price: 950_000,
    usableArea: 210,
    totalArea: 400,
    bedrooms: 4,
    bathrooms: 3,
    parkingSpaces: 2,
    ageInYears: 12,
    isFeatured: false,
    features: ["Jardín", "Quincho", "Calefacción", "Pet friendly", "Lavandería"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000012",
    title: "Departamento patrimonial remodelado en arriendo en Lota",
    description:
      "Departamento de 70 m² en una construcción de carácter patrimonial de Lota, ciudad con historia minera y su Parque de Lota, hoy completamente remodelado. Living luminoso con ventanales, cocina renovada, 2 dormitorios y 1 baño. Un hogar con encanto y precio accesible, ideal para quien trabaja en la zona o busca vivir cerca de la costa y del patrimonio de la ciudad.",
    address: "Pasaje Lota Alto 250, Lota",
    region: BIOBIO,
    city: "Lota",
    commune: centerSectorOf("Lota"),
    price: 390_000,
    usableArea: 70,
    totalArea: 70,
    bedrooms: 2,
    bathrooms: 1,
    parkingSpaces: 0,
    ageInYears: 60,
    isFeatured: false,
    features: ["Calefacción", "Pet friendly"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000014",
    title: "Local comercial en arriendo en pleno centro de Coronel",
    description:
      "Local comercial de 90 m² en el centro de Coronel, con vitrina a calle de alto tránsito peatonal y vehicular, a pasos de servicios, bancos y locomoción. Salón de ventas amplio, bodega trasera, baño y buena iluminación. Perfecto para tienda de ropa, comercio minorista o servicios, en una ciudad portuaria con actividad constante.",
    address: "Calle Lautaro 560, Coronel",
    region: BIOBIO,
    city: "Coronel",
    commune: centerSectorOf("Coronel"),
    price: 620_000,
    usableArea: 90,
    totalArea: 90,
    bedrooms: null,
    bathrooms: 1,
    parkingSpaces: null,
    ageInYears: 20,
    isFeatured: false,
    features: ["Bodega", "Seguridad"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000018",
    title: "Oficina vidriada equipada en arriendo en Tomé",
    description:
      "Oficina de 45 m² totalmente equipada en el centro de Tomé, ciudad de playas y viñedos, con ventanales amplios, buena iluminación y mobiliario incluido. Espacio de trabajo con sala de reuniones, baño y conexión a internet. Ideal para un profesional independiente, una agencia o una empresa que necesita presencia en la costa sin invertir en habilitar un local.",
    address: "Calle Ignacio Serrano 310, Tomé",
    region: BIOBIO,
    city: "Tomé",
    commune: centerSectorOf("Tomé"),
    price: 320_000,
    usableArea: 45,
    totalArea: 45,
    bedrooms: null,
    bathrooms: 1,
    parkingSpaces: 0,
    ageInYears: 9,
    isFeatured: false,
    features: ["Amoblado", "Aire acondicionado", "Seguridad"],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000009",
    title: "Parcela de 1 hectárea con vista al mar en Lebu",
    description:
      "Parcela de 10.000 m² en la costa de Lebu, Provincia de Arauco, con vistas abiertas al océano y entorno natural. Terreno de buena superficie para construir una casa de descanso, cabañas o un proyecto turístico en una zona de creciente interés. Acceso por camino costero. Ideal para quien sueña con vivir o invertir frente al mar, lejos del ruido y cerca de la naturaleza.",
    address: "Camino Costero km 5, Lebu",
    region: ARAUCO,
    city: "Lebu",
    commune: centerSectorOf("Lebu"),
    price: 62_000_000,
    usableArea: null,
    totalArea: 10000,
    bedrooms: null,
    bathrooms: null,
    parkingSpaces: null,
    ageInYears: null,
    isFeatured: true,
    features: ["Vista panoramica naturalesa privilegiada"],
  },

  // ------------------------------------------------------------------ Hidden rows (not in the catalog)
  {
    id: "01a10d2f-1ba5-7029-b32c-fa5123dfd7dd",
    title: "Hola",
    description: "Publicación de prueba eliminada.",
    address: "Calle Prueba 1, Cañete",
    region: ARAUCO,
    city: "Cañete",
    commune: centerSectorOf("Cañete"),
    price: 950_000,
    usableArea: 150,
    totalArea: 200,
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 2,
    ageInYears: 1,
    isFeatured: false,
    features: [],
  },
  {
    id: "5eed0000-0000-4000-8000-000000000019",
    title: "Casa de campo con terreno amplio en Hualqui",
    description:
      "Casa de 190 m² en un terreno de 2.500 m² cerca de Hualqui, con techos a dos aguas y amplios ventanales hacia el entorno natural. Tiene 4 dormitorios, 3 baños, living con estufa, terraza, quincho y estacionamiento para 3 autos. Una propiedad pensada para vivir en contacto con la naturaleza sin dejar de estar a minutos de la ciudad.",
    address: "Camino a Quilacoya km 5, Hualqui",
    region: BIOBIO,
    city: "Hualqui",
    commune: centerSectorOf("Hualqui"),
    price: 255_000_000,
    usableArea: 190,
    totalArea: 2500,
    bedrooms: 4,
    bathrooms: 3,
    parkingSpaces: 3,
    ageInYears: 11,
    isFeatured: false,
    features: ["Terraza", "Quincho", "Calefacción", "Jardín", "Vista panoramica naturalesa privilegiada"],
  },
];

/**
 * Properties that are not part of the seed (created by hand in a real database): only their
 * location is moved to the catalog values, so they show up under the filters once published.
 * Their title, description, price and photos are never touched.
 */
export type LocationOnly = { id: string; note: string; region: string; city: string; commune: string };

export const LOCATION_ONLY: LocationOnly[] = [
  {
    id: "01a11484-728d-708c-92b1-8fa338ea26ba",
    note: "Casa en Venta en Cañete (unpublished, created by hand)",
    region: ARAUCO,
    city: "Cañete",
    commune: centerSectorOf("Cañete"),
  },
];
