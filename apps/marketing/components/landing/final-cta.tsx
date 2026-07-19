import { TrialCta, CtaLink } from "@/components/ui/cta";
import { Reveal } from "@/components/motion/reveal";
import { siteConfig } from "@/lib/site";

export function FinalCta() {
  return (
    <section className="section-pad relative overflow-hidden" aria-labelledby="final-cta">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,var(--signal-glow),transparent_60%)]"
      />
      <div className="container-site relative text-center">
        <Reveal>
          <p className="eyebrow justify-self-center">Comece agora</p>
          <h2
            id="final-cta"
            className="display-lg mx-auto mt-4 max-w-[14ch] text-[clamp(2.2rem,6vw,3.6rem)] text-ink"
          >
            Tire a oficina do caderno em {siteConfig.trialDays} dias.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base text-ink-dim">
            Risco baixo: trial completo, cobrança só depois. Se não servir, cancela
            no portal.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <TrialCta />
            <CtaLink href="/contato" variant="ghost" external={false}>
              Falar com vendas
            </CtaLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
