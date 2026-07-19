import Link from "next/link";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Ajuda — Oficina",
  description: "Perguntas frequentes do sistema Oficina",
};

const FAQS = [
  {
    q: "Quanto custa?",
    a: "R$ 97 por mês ou R$ 970 por ano. Os primeiros 14 dias são grátis; o cartão é cadastrado no início e a cobrança começa depois do trial.",
  },
  {
    q: "Vou ser cobrado na hora?",
    a: "Não. Durante o trial o valor é R$ 0. Depois dos 14 dias o Stripe cobra automaticamente o plano escolhido.",
  },
  {
    q: "Como convido meu mecânico?",
    a: "Em Usuários → Convidar. Envie o link /invite/... por WhatsApp se o e-mail não chegar.",
  },
  {
    q: "Como envio orçamento ao cliente?",
    a: "Abra a OS → Orçamento → Imprimir/PDF ou botão WhatsApp (com telefone cadastrado no cliente).",
  },
  {
    q: "Esqueci a senha",
    a: "Na tela de login use “Esqueci a senha” e informe o e-mail da conta.",
  },
  {
    q: "Como cancelo?",
    a: "Assinatura → Portal Stripe → cancelar. O acesso permanece até o fim do período vigente.",
  },
  {
    q: "Posso usar no celular?",
    a: "Sim, pelo navegador. Não há app nativo nesta versão.",
  },
];

export default function AjudaPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          ← Oficina
        </Link>
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
        Ajuda
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dúvidas frequentes. Se algo travar o seu dia, responda o WhatsApp de quem te convidou.
      </p>

      <div className="mt-8 space-y-3">
        {FAQS.map((item) => (
          <Card key={item.q} className="space-y-2 p-4">
            <h2 className="font-semibold">{item.q}</h2>
            <p className="text-sm text-muted-foreground">{item.a}</p>
          </Card>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Ainda sem conta?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Começar trial
        </Link>
      </p>
    </main>
  );
}
