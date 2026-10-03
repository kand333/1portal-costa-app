import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-5 px-4 py-24 sm:px-6">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Propiedad no encontrada</h1>
      <p className="text-lg text-muted">
        Esta propiedad no existe o ya no está publicada. Revisa el catálogo para ver las disponibles.
      </p>
      <Link
        href="/properties"
        className="inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover"
      >
        Ver propiedades
      </Link>
    </section>
  );
}
