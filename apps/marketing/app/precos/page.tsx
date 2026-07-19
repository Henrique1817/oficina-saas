import type { Metadata } from "next";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { formatBRL, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Preços",
  description: `Oficina: ${formatBRL(siteConfig.priceMonthly)}/mês ou ${formatBRL(siteConfig.priceYearly)}/ano. Trial de ${siteConfig.trialDays} dias.`,
};

export default function PrecosPage() {
  return (
    <div className="pt-[var(--header-h)]">
      <div className="container-site pt-16 pb-4">
        <p className="eyebrow">Preços</p>
        <h1 className="display-lg mt-4 max-w-[16ch] text-[clamp(2.2rem,5vw,3.6rem)] text-ink">
          Quanto custa tirar a oficina da planilha.
        </h1>
      </div>
      <Pricing id="tabela" />
      <Faq id="precos-faq" />
      <FinalCta />
    </div>
  );
}
