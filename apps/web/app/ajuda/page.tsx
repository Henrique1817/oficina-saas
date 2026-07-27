import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SupportContactBanner } from "@/components/support-contact-banner";

export const metadata = {
  title: "Ajuda — Oficina",
  description: "Perguntas frequentes do sistema Oficina",
};

const FAQS = [
  {
    q: "Quanto custa?",
    a: "R$ 97 por mês ou R$ 970 por ano. Os primeiros 14 dias são grátis; o cartão é cadastrado no início e a cobrança começa depois do trial. Pilotos em cortesia não são cobrados até combinarmos o contrário.",
  },
  {
    q: "Vou ser cobrado na hora?",
    a: "Não. Durante o trial o valor é R$ 0. Depois dos 14 dias o Mercado Pago cobra automaticamente o plano escolhido (exceto cortesia / design partner).",
  },
    {
      q: "Como convido meu mecânico?",
      a: "Em Usuários → Convidar. Um e-mail só pode ter um papel na oficina. Envie o link /invite/... por WhatsApp se o e-mail não chegar.",
    },
  {
    q: "Como envio orçamento ao cliente?",
    a: "Abra a OS → Orçamento → Imprimir/PDF ou botão WhatsApp (com telefone cadastrado no cliente). Em Oficina / Orçamento você edita validade e templates.",
  },
  {
    q: "Como autorizo o serviço?",
    a: "Na OS → Autorização: aceite digital ou imprimir o termo para o cliente assinar.",
  },
  {
    q: "Estoque baixo / entrada rápida",
    a: "Em Estoque use “Movimento rápido” (SKU ou nome) ou o filtro Estoque baixo. Mecânicos podem dar entrada/saída; ajuste só gerente.",
  },
  {
    q: "Esqueci a senha",
    a: "Na tela de login use “Esqueci a senha” e informe o e-mail da conta.",
  },
  {
    q: "Como cancelo?",
    a: "Em Assinatura (`/billing`) → cancelar assinatura. O acesso permanece até o fim do período vigente.",
  },
  {
    q: "Posso usar no celular?",
    a: "Sim, pelo navegador. Não há app nativo nesta versão.",
  },
];

export default function AjudaPage() {
  return (
    <main className="relative mx-auto max-w-2xl px-6 py-12">
      <div className="grain opacity-[0.06]" aria-hidden />
      <p className="mono-label text-ink-mute">
        <Link href="/" className="hover:text-signal">
          ← Oficina
        </Link>
      </p>
      <h1 className="display-lg mt-4 text-4xl text-ink">Ajuda</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-dim">
        Dúvidas frequentes. Se algo travar o seu dia, use o atalho de suporte abaixo.
      </p>

      <div className="mt-8">
        <SupportContactBanner />
      </div>

      <div className="mt-6 space-y-3">
        {FAQS.map((item) => (
          <Card key={item.q} className="space-y-2 p-5">
            <h2 className="font-semibold tracking-tight text-ink">{item.q}</h2>
            <p className="text-sm leading-relaxed text-ink-dim">{item.a}</p>
          </Card>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-ink-mute">
        <Link href="/billing" className="hover:text-signal">
          Assinatura
        </Link>
        {" · "}
        <Link href="/workshop" className="hover:text-signal">
          Voltar ao painel
        </Link>
      </p>
    </main>
  );
}
