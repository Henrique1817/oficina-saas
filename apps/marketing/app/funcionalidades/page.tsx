import type { Metadata } from "next";
import Link from "next/link";
import { ProductScenes } from "@/components/landing/product-scenes";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FinalCta } from "@/components/landing/final-cta";
import { TrialCta } from "@/components/ui/cta";

export const metadata: Metadata = {
  title: "Funcionalidades",
  description:
    "Dashboard, OS, orçamento no WhatsApp, estoque, ferramentas e equipe — o ciclo fechado da oficina.",
};

const highlights = [
  {
    title: "Dashboard operacional",
    body: "OS abertas, estoque baixo, ferramentas em uso — atalhos pro dia.",
  },
  {
    title: "Clientes e veículos",
    body: "Placa, modelo, ano, problema relatado. Fitment no modelo de dados.",
  },
  {
    title: "Ordens de serviço",
    body: "Rascunho → aprovada → em execução → concluída → faturada / cancelada.",
  },
  {
    title: "Orçamento + WhatsApp",
    body: "Envio, aprovação, PDF/impressão e atalho pro canal que já fecha serviço.",
  },
  {
    title: "Estoque de peças",
    body: "Catálogo, locais, movimentos e alerta de estoque baixo.",
  },
  {
    title: "Ferramentas e equipe",
    body: "Retirada/devolução. Papéis Admin, Gerente e Mecânico com convites.",
  },
];

export default function FuncionalidadesPage() {
  return (
    <div className="pt-[var(--header-h)]">
      <section className="border-b border-line">
        <div className="container-site section-pad">
          <p className="eyebrow">Funcionalidades</p>
          <h1 className="display-lg mt-4 max-w-[18ch] text-[clamp(2.2rem,5vw,3.6rem)] text-ink">
            O ciclo da oficina, fechado de ponta a ponta.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-dim">
            Não é só CRM. Cadastro → orçamento → OS → estoque → ferramenta — com
            billing Stripe e trial de 14 dias.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrialCta />
            <Link
              href="/precos"
              className="inline-flex items-center border border-line-strong px-6 py-3.5 text-sm text-ink-dim transition hover:border-signal hover:text-signal"
              data-cursor="hot"
            >
              Ver preços
            </Link>
          </div>

          <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h) => (
              <li key={h.title}>
                <h2 className="text-lg font-semibold text-ink">{h.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{h.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <HowItWorks />
      <ProductScenes />
      <FinalCta />
    </div>
  );
}
