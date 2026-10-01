import Link from "next/link";

const actions = [
  {
    title: "¿Quieres comprar?",
    description: "Explora casas, departamentos, oficinas y terrenos en venta en todo Chile.",
    href: "/properties?operation=SALE",
    label: "Ver propiedades en venta",
  },
  {
    title: "¿Buscas arriendo?",
    description: "Encuentra tu próximo hogar u oficina en arriendo con información completa.",
    href: "/properties?operation=RENT",
    label: "Ver propiedades en arriendo",
  },
];

const buttonClassName =
  "inline-flex rounded-lg px-5 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600";

export function CallToActionSection() {
  return (
    <section aria-labelledby="call-to-action-title" className="bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 id="call-to-action-title" className="sr-only">
          Comienza tu búsqueda
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {actions.map((action) => (
            <div
              key={action.href}
              className="flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{action.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400">{action.description}</p>
              <Link href={action.href} className={`${buttonClassName} mt-2 bg-sky-700 text-white hover:bg-sky-800`}>
                {action.label}
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl bg-sky-800 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold">Guarda las propiedades que te interesan</h3>
            <p className="mt-1 text-sky-100">Ingresa para guardar favoritos y revisar tus consultas.</p>
          </div>
          <Link href="/login" className={`${buttonClassName} bg-white text-sky-900 hover:bg-sky-50`}>
            Ingresar
          </Link>
        </div>
      </div>
    </section>
  );
}
