import { Reveal } from "@/components/home/reveal";

const steps = [
  { title: "Cuéntanos dónde está", description: "Dirección o sector y comuna. Toma menos de un minuto." },
  { title: "Un corredor local la revisa", description: "Compara con propiedades similares de tu zona y evalúa su estado." },
  { title: "Recibes tu rango de precio", description: "Te contactamos por email o teléfono con la tasación y los siguientes pasos." },
];

/** The ask-versus-paid argument (a wipe) followed by the three steps of the process. */
export function LeadSteps() {
  return (
    <section aria-labelledby="gap-title" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 id="gap-title" className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            Un precio pedido no es un precio pagado
          </h2>
          <p className="mt-4 max-w-md text-muted">
            Publicar muy alto aleja a los compradores; muy bajo regala dinero. Una buena tasación parte de lo que de
            verdad se cierra en tu zona.
          </p>
        </div>
        <Reveal className="self-center rounded-[1.5rem] border border-line bg-surface p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ilustración, sin cifras reales</p>
          <div className="mt-5 space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Lo que se pide</p>
              <div className="h-4 w-full rounded-full bg-brass/40" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Lo que se paga</p>
              <div className="h-4 w-[82%] rounded-full bg-accent" />
            </div>
          </div>
        </Reveal>
      </div>

      <h2 className="mt-24 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Así funciona</h2>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Reveal delay={index * 0.12} className="h-full rounded-[1.25rem] border border-line bg-surface p-6">
              <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-2 text-muted">{step.description}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
