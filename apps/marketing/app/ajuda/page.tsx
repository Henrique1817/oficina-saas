import type { Metadata } from "next";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ajuda",
  description:
    "FAQ do Oficina: trial, cartão, cancelamento, papéis e isolamento de dados.",
};

export default function AjudaPage() {
  return (
    <div className="pt-[var(--header-h)]">
      <div className="container-site pt-16 pb-4">
        <p className="eyebrow">Ajuda</p>
        <h1 className="display-lg mt-4 max-w-[16ch] text-[clamp(2.2rem,5vw,3.6rem)] text-ink">
          Trial, cartão, cancelamento e papéis.
        </h1>
        <p className="mt-5 max-w-xl text-base text-ink-dim">
          Respostas diretas pro dono de oficina. Preço: R${" "}
          {siteConfig.priceMonthly}/mês ou R$ {siteConfig.priceYearly}/ano ·{" "}
          {siteConfig.trialDays} dias grátis.
        </p>
      </div>
      <Faq />
      <FinalCta />
    </div>
  );
}
