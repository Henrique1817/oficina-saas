import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Política de privacidade do produto Oficina (placeholder legal).",
};

export default function PrivacidadePage() {
  return (
    <div className="pt-[var(--header-h)]">
      <article className="container-site section-pad max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="display-lg mt-4 text-[clamp(2rem,4vw,3rem)] text-ink">
          Privacidade
        </h1>
        <div className="mt-10 space-y-5 text-sm leading-relaxed text-ink-dim [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_strong]:text-ink">
          <p>
            Este documento é um <strong>placeholder</strong>. Substitua por
            política revisada juridicamente antes de operação em escala.
          </p>
          <h2>Dados que tratamos</h2>
          <p>
            Conta de usuário (e-mail, autenticação), dados da oficina e registros
            operacionais que você cadastrar (clientes, veículos, OS, estoque,
            ferramentas), além de dados de cobrança processados pelo Stripe.
          </p>
          <h2>Finalidade</h2>
          <p>
            Prestação do serviço SaaS, autenticação, cobrança, suporte e
            melhoria do produto. Isolamento por organização (multi-tenant).
          </p>
          <h2>Compartilhamento</h2>
          <p>
            Prestadores necessários à operação (ex.: hospedagem, autenticação,
            e-mail e Stripe). Não vendemos sua base de clientes.
          </p>
          <h2>Contato</h2>
          <p>
            Solicitações relacionadas a privacidade:{" "}
            <Link
              href="/contato"
              className="text-signal underline-offset-2 hover:underline"
            >
              /contato
            </Link>
            .
          </p>
        </div>
      </article>
    </div>
  );
}
