import type { Metadata } from "next";
import Link from "next/link";
import { ProductScenes } from "@/components/landing/product-scenes";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FinalCta } from "@/components/landing/final-cta";
import { TrialCta } from "@/components/ui/cta";

export const metadata: Metadata = {
  title: "Funcionalidades",
  description:
    "Agenda do dia, OS, orçamento WhatsApp, autorização, estoque rápido, histórico do cliente e ferramentas na OS.",
};

const highlights = [
  {
    title: "Agenda do dia",
    body: "Prazos de hoje, OS atrasadas e quadro por mecânico — a operação do dia numa tela.",
  },
  {
    title: "Clientes e histórico",
    body: "Ficha com veículos, OS anteriores, peças usadas e atalho para nova ordem.",
  },
  {
    title: "Ordens de serviço",
    body: "Rascunho → aprovada → em execução → concluída → faturada. Mão de obra, peças e prazo.",
  },
  {
    title: "Orçamento + WhatsApp",
    body: "Templates da oficina, validade, PDF/impressão e envio no canal que já fecha serviço.",
  },
  {
    title: "Autorização de serviço",
    body: "Aceite digital ou termo impresso — autorização clara de peças e serviço (não é NF-e).",
  },
  {
    title: "Estoque no ritmo do chão",
    body: "Busca por SKU/nome, entrada/saída rápida, reserva/consumo na OS e alerta de mínimo.",
  },
  {
    title: "Ferramentas na OS",
    body: "Checkout e devolução vinculados à ordem aprovada ou em execução.",
  },
  {
    title: "Equipe e papéis",
    body: "Admin, Gerente e Mecânico. Convites por link (e-mail ou WhatsApp).",
  },
  {
    title: "Assinatura Stripe",
    body: "14 dias grátis, cobrança automática depois. Portal para cancelar ou trocar plano.",
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
            Agenda, cadastro, orçamento, autorização, OS, estoque e ferramenta —
            com trial de 14 dias e cobrança Stripe.
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
