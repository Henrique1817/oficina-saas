import { Hero } from "@/components/landing/hero";
import { PainSolution } from "@/components/landing/pain-solution";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductScenes } from "@/components/landing/product-scenes";
import { Trust } from "@/components/landing/trust";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { StickyTrialCue } from "@/components/landing/sticky-trial-cue";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PainSolution />
      <HowItWorks />
      <ProductScenes />
      <Trust />
      <Pricing />
      <Faq />
      <FinalCta />
      <StickyTrialCue />
    </>
  );
}
