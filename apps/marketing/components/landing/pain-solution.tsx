import { Reveal } from "@/components/motion/reveal";

export function PainSolution() {
  return (
    <section className="section-pad border-b border-line" aria-labelledby="dor-heading">
      <div className="container-site">
        <Reveal>
          <p className="eyebrow">A dor</p>
          <h2
            id="dor-heading"
            className="display-lg mt-4 max-w-[16ch] text-[clamp(2rem,5vw,3.4rem)] text-ink"
          >
            Planilha. WhatsApp. Caderno. Estoque que some.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <p className="mono-label text-alert">Hoje</p>
            <p className="mt-4 text-lg leading-relaxed text-ink-dim">
              Orçamento numa conversa. OS noutro lugar. Peça que “tinha ontem”.
              Ferramenta que ninguém sabe quem pegou. O dono vira secretário.
            </p>
          </Reveal>
          <Reveal>
            <p className="mono-label text-ok">Com o Oficina</p>
            <p className="mt-4 text-lg leading-relaxed text-ink-dim">
              Ciclo fechado: cliente e veículo → orçamento → OS → estoque →
              ferramenta. Um ambiente por oficina. Equipe com papéis claros.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
