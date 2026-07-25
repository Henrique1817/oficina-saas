"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/site";

const faqs = [
  {
    q: "Por que preciso de cartão no trial?",
    a: "O trial de 14 dias exige cartão no cadastro para ativar a assinatura Mercado Pago. A cobrança começa só depois do período gratuito — sem surpresa no meio do teste.",
  },
  {
    q: "Como cancelo?",
    a: "Em Assinatura (`/billing`) → cancelar assinatura. Sem ligação, sem “fale com o gerente”.",
  },
  {
    q: "Qual a diferença entre Admin, Gerente e Mecânico?",
    a: "Admin cuida de tudo (usuários e billing). Gerente opera cadastros, OS, estoque e ferramentas. Mecânico atua no chão, com restrições sensatas — por exemplo, OS atribuída.",
  },
  {
    q: "Meus dados ficam misturados com outras oficinas?",
    a: "Não. Cada oficina é uma organização isolada. Isolamento multi-tenant é parte do produto, não detalhe técnico escondido.",
  },
  {
    q: "Tem emissão de NF-e?",
    a: `Ainda não. Nesta fase também não há ${siteConfig.excludedScope.filter((x) => x !== "NF-e").join(", ").toLowerCase()}. É transparência de escopo — soft launch focado no ciclo OS → estoque.`,
  },
  {
    q: "Quanto custa depois do trial?",
    a: `R$ ${siteConfig.priceMonthly}/mês ou R$ ${siteConfig.priceYearly}/ano (2 meses de desconto no anual).`,
  },
];

export function Faq({ id = "faq" }: { id?: string }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id={id}
      className="section-pad border-b border-line bg-bg-elevated"
      aria-labelledby="faq-heading"
    >
      <div className="container-site">
        <p className="eyebrow">FAQ</p>
        <h2
          id="faq-heading"
          className="display-lg mt-4 max-w-[12ch] text-[clamp(2rem,5vw,3.2rem)] text-ink"
        >
          Perguntas de quem fecha a conta.
        </h2>

        <div className="mt-12 divide-y divide-line border border-line bg-bg-panel">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-6 px-5 py-5 text-left transition hover:bg-bg-soft/60 md:px-7"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  data-cursor="hot"
                >
                  <span className="text-base font-medium text-ink md:text-lg">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className={[
                      "mt-1 font-[family-name:var(--font-mono)] text-signal transition",
                      isOpen ? "rotate-45" : "",
                    ].join(" ")}
                  >
                    +
                  </span>
                </button>
                {isOpen ? (
                  <div className="px-5 pb-6 md:px-7">
                    <p className="max-w-2xl text-sm leading-relaxed text-ink-dim md:text-base">
                      {item.a}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
