const questions = [
  {
    question: "¿Qué significa el valor de una propiedad?",
    answer:
      "Es el precio al que propiedades parecidas se ofrecen hoy en la misma zona. Conocerlo ayuda a decidir a cuánto publicar para vender o arrendar sin quedarse corto ni asustar a los interesados.",
  },
  {
    question: "¿Cómo funciona el tasador y cuánto cuesta?",
    answer:
      "Es gratis. Comparamos tu propiedad con las publicadas en este portal, del mismo tipo y operación, y calculamos un precio por m² que ajustamos por dormitorios, baños y estacionamientos. El resultado aparece en segundos.",
  },
  {
    question: "¿Qué tan preciso es el resultado?",
    answer:
      "Es una estimación orientativa. No ve el estado, la orientación ni las terminaciones de tu propiedad, y depende de cuántas propiedades comparables haya publicadas. Las amenidades que marcas suman un ajuste pequeño y fijo, no uno medido en el mercado. Si necesitas una cifra más precisa, un corredor puede tasarla contigo.",
  },
] as const;

export function ValuationFaq() {
  return (
    <section aria-labelledby="valuation-faq-title" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <h2 id="valuation-faq-title" className="text-center text-3xl font-semibold tracking-tight text-ink">
        Preguntas frecuentes
      </h2>
      <div className="mx-auto mt-8 max-w-5xl divide-y divide-line border-b border-line">
        {questions.map((item) => (
          <details key={item.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {item.question}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
