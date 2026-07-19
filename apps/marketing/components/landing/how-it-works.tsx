"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const steps = [
  {
    n: "01",
    title: "Cadastre a oficina",
    body: "Signup, cria o ambiente da sua organização e convida a equipe.",
  },
  {
    n: "02",
    title: "14 dias grátis",
    body: "Cartão no cadastro — cobrança só depois do trial. Use com OS real.",
  },
  {
    n: "03",
    title: "OS, estoque, orçamento",
    body: "Fecha o serviço no sistema: orçamento no WhatsApp, peças na OS.",
  },
  {
    n: "04",
    title: "Cobrança automática",
    body: "Stripe cuida da assinatura. Portal self-serve pra alterar ou cancelar.",
  },
];

export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      gsap.from("[data-step]", {
        y: 40,
        opacity: 0,
        duration: 0.75,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 75%",
          once: true,
        },
      });
    },
    { scope: root },
  );

  return (
    <section
      id="como-funciona"
      ref={root}
      className="section-pad border-b border-line bg-bg-elevated"
      aria-labelledby="how-heading"
    >
      <div className="container-site">
        <p className="eyebrow">Como funciona</p>
        <h2
          id="how-heading"
          className="display-lg mt-4 max-w-[14ch] text-[clamp(2rem,5vw,3.2rem)] text-ink"
        >
          Do signup à cobrança — sem surpresa.
        </h2>

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.n} data-step className="relative">
              <p className="font-[family-name:var(--font-mono)] text-3xl text-signal/80">
                {step.n}
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
