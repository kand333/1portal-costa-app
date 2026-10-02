import Link from "next/link";

const actions = [
  {
    title: "¿Quieres comprar?",
    description: "Explora casas, departamentos, oficinas y terrenos en venta en todo Chile.",
    href: "/properties?operation=SALE",
    label: "Ver propiedades en venta",
    tone: "dark",
  },
  {
    title: "¿Buscas arriendo?",
    description: "Encuentra tu próximo hogar u oficina en arriendo con información completa.",
    href: "/properties?operation=RENT",
    label: "Ver propiedades en arriendo",
    tone: "light",
  },
] as const;

const buttonClassName =
  "inline-flex h-12 items-center rounded-full px-7 font-semibold transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-px active:translate-y-0";

export function CallToActionSection() {
  return (
    <section aria-labelledby="call-to-action-title" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <h2 id="call-to-action-title" className="sr-only">
        Comienza tu búsqueda
      </h2>
      <div className="grid gap-5 md:grid-cols-2">
        {actions.map((action) => (
          <div
            key={action.href}
            className={
              action.tone === "dark"
                ? "relative isolate flex min-h-72 flex-col items-start justify-end gap-4 overflow-hidden rounded-[1.75rem] bg-[#1e3b3a] p-8 text-[#f6f5f2] sm:p-10"
                : "relative isolate flex min-h-72 flex-col items-start justify-end gap-4 overflow-hidden rounded-[1.75rem] border border-line bg-surface p-8 text-ink sm:p-10"
            }
          >
            {action.tone === "dark" && (
              <div
                aria-hidden="true"
                className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-[radial-gradient(circle,rgb(169_139_91/0.35),transparent_65%)]"
              />
            )}
            <h3 className="font-display text-4xl font-semibold leading-tight tracking-tight">{action.title}</h3>
            <p className={action.tone === "dark" ? "max-w-sm text-[#f6f5f2]/75" : "max-w-sm text-muted"}>
              {action.description}
            </p>
            <Link
              href={action.href}
              className={
                action.tone === "dark"
                  ? `${buttonClassName} mt-2 bg-[#f6f5f2] text-[#121719] hover:bg-white`
                  : `${buttonClassName} mt-2 bg-accent text-on-accent hover:bg-accent-hover`
              }
            >
              {action.label}
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col items-start gap-5 rounded-[1.75rem] border border-line px-8 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Guarda las propiedades que te interesan
          </h3>
          <p className="mt-1 text-muted">Ingresa para guardar favoritos y revisar tus consultas.</p>
        </div>
        <Link
          href="/login"
          className={`${buttonClassName} shrink-0 border border-line text-ink hover:border-brass hover:bg-surface`}
        >
          Ingresar
        </Link>
      </div>
    </section>
  );
}
