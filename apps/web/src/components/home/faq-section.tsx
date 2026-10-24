const questions = [
  { question: "¿La tasación es gratis?", answer: "Sí. Dejas tus datos, un corredor revisa tu propiedad y te contacta sin costo ni compromiso." },
  { question: "¿Qué propiedades puedo tasar?", answer: "Casas, departamentos, oficinas, locales y terrenos de Concepción y comunas cercanas." },
  { question: "¿Cómo se calcula el valor?", answer: "Se compara con propiedades similares de la zona y se considera el estado, la superficie y la ubicación." },
  { question: "¿Reemplaza una tasación bancaria?", answer: "No. Es una referencia comercial para decidir cuánto pedir o pagar; los bancos exigen su propia tasación." },
  { question: "¿Necesito una cuenta?", answer: "No. Puedes enviar la solicitud como visitante; con una cuenta además ves tus consultas en un solo lugar." },
];

export function FaqSection() {
  return (
    <section aria-labelledby="faq-title" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h2 id="faq-title" className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Preguntas frecuentes
      </h2>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {questions.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
              {item.question}
              <span aria-hidden="true" className="text-brass-text transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-2 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">La tasación es referencial y no reemplaza una tasación bancaria.</p>
    </section>
  );
}
