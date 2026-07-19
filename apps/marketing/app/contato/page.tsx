import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com vendas ou peça uma demonstração do Oficina.",
};

export default function ContatoPage() {
  const wa = whatsappUrl();

  return (
    <div className="pt-[var(--header-h)]">
      <section className="section-pad">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="eyebrow">Contato</p>
            <h1 className="display-lg mt-4 max-w-[12ch] text-[clamp(2.2rem,5vw,3.4rem)] text-ink">
              Quer ver funcionando na sua oficina?
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-dim">
              Mande mensagem — respondemos sobre demonstração, trial e se o
              produto cabe no seu fluxo. Sem pitch de “transformação digital”.
            </p>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex border border-line-strong px-5 py-3 text-sm text-ink transition hover:border-signal hover:text-signal"
                data-cursor="hot"
              >
                Abrir WhatsApp
              </a>
            ) : (
              <p className="mt-8 font-[family-name:var(--font-mono)] text-xs text-ink-mute">
                Configure NEXT_PUBLIC_WHATSAPP no .env para o atalho direto.
              </p>
            )}
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
