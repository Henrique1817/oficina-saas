"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TrialCta } from "@/components/ui/cta";
import {
  formatBRL,
  siteConfig,
} from "@/lib/site";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const included = [
  "Clientes e veículos",
  "OS com estados completos",
  "Orçamento + WhatsApp",
  "Estoque e alertas",
  "Controle de ferramentas",
  "Equipe Admin / Gerente / Mecânico",
  "Billing Mercado Pago self-serve",
  "Ambiente isolado por oficina",
];

type Billing = "month" | "year";

export function Pricing({ id = "precos" }: { id?: string }) {
  const [billing, setBilling] = useState<Billing>("month");
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      gsap.from("[data-price-card]", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 78%",
          once: true,
        },
      });
    },
    { scope: root },
  );

  const price =
    billing === "month" ? siteConfig.priceMonthly : siteConfig.priceYearly;
  const period = billing === "month" ? "/mês" : "/ano";
  const note =
    billing === "year"
      ? "Equivale a 10 meses — 2 meses de desconto."
      : "Ou R$ 970/ano (2 meses off).";

  return (
    <section
      id={id}
      ref={root}
      className="section-pad border-b border-line"
      aria-labelledby="pricing-heading"
    >
      <div className="container-site">
        <p className="eyebrow">Preço simples</p>
        <h2
          id="pricing-heading"
          className="display-lg mt-4 max-w-[14ch] text-[clamp(2rem,5vw,3.2rem)] text-ink"
        >
          Um plano. Trial de {siteConfig.trialDays} dias.
        </h2>
        <p className="mt-5 max-w-lg text-base text-ink-dim">
          Cartão no cadastro. Cobrança só depois do trial. Cancele em `/billing`
          quando quiser.
        </p>

        <div className="mt-8 inline-flex border border-line p-1" role="group" aria-label="Periodicidade">
          <button
            type="button"
            onClick={() => setBilling("month")}
            className={[
              "px-4 py-2 text-xs font-semibold tracking-wide transition",
              billing === "month"
                ? "bg-signal text-bg"
                : "text-ink-dim hover:text-ink",
            ].join(" ")}
            data-cursor="hot"
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setBilling("year")}
            className={[
              "px-4 py-2 text-xs font-semibold tracking-wide transition",
              billing === "year"
                ? "bg-signal text-bg"
                : "text-ink-dim hover:text-ink",
            ].join(" ")}
            data-cursor="hot"
          >
            Anual
          </button>
        </div>

        <div
          data-price-card
          className="mt-10 grid gap-0 border border-line lg:grid-cols-[1.1fr_1fr]"
        >
          <div className="bg-bg-panel p-8 md:p-10">
            <p className="mono-label text-signal">Oficina · plano único</p>
            <p className="mt-6 font-[family-name:var(--font-mono)] text-[clamp(2.8rem,8vw,4.5rem)] font-bold leading-none tracking-tight text-ink">
              {formatBRL(price)}
              <span className="ml-1 text-base font-normal text-ink-mute">
                {period}
              </span>
            </p>
            <p className="mt-3 text-sm text-ink-dim">{note}</p>
            <p className="mt-6 border-l-2 border-ok pl-4 text-sm leading-relaxed text-ink-dim">
              <span className="text-ok">{siteConfig.trialDays} dias grátis</span> —
              teste com OS real da semana. Sem cobrança no período de trial.
            </p>
            <div className="mt-8">
              <TrialCta />
            </div>
          </div>

          <div className="border-t border-line bg-bg-elevated p-8 md:border-l md:border-t-0 md:p-10">
            <p className="mono-label text-ink-mute">Incluso</p>
            <ul className="mt-5 space-y-3">
              {included.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm text-ink-dim"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ok" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-line pt-6">
              <p className="mono-label text-ink-mute">Fora do escopo agora</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                {siteConfig.excludedScope.join(" · ")}. Roadmap após product-market
                fit — sem promessa vazia no pitch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
