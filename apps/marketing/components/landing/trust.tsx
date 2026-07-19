import { Reveal } from "@/components/motion/reveal";

const pillars = [
  {
    title: "Sua oficina isolada",
    body: "Cada organização tem o próprio ambiente. Dados da sua oficina não se misturam com os de outra.",
  },
  {
    title: "Cobrança com Stripe",
    body: "Checkout e portal self-serve. Trial, plano ativo, inadimplência e cancelamento — transparente.",
  },
  {
    title: "Papéis no chão de fábrica",
    body: "Admin, Gerente e Mecânico. Convites por link. Quem opera no pit não precisa de acesso a billing.",
  },
];

export function Trust() {
  return (
    <section
      className="section-pad border-b border-line bg-bg-elevated"
      aria-labelledby="trust-heading"
    >
      <div className="container-site">
        <Reveal>
          <p className="eyebrow">Confiança</p>
          <h2
            id="trust-heading"
            className="display-lg mt-4 max-w-[16ch] text-[clamp(2rem,5vw,3.2rem)] text-ink"
          >
            Feito pra dono de oficina — não pra deck de investidor.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-dim">
            Segurança multi-tenant e assinatura de verdade. Sem inventar depoimento
            nem logo de cliente. O produto fala pelo fluxo.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {pillars.map((p) => (
            <Reveal key={p.title}>
              <h3 className="text-lg font-semibold text-ink">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
