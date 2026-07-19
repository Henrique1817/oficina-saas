import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Termos de uso do produto Oficina (placeholder legal).",
};

export default function TermosPage() {
  return (
    <div className="pt-[var(--header-h)]">
      <article className="container-site section-pad max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="display-lg mt-4 text-[clamp(2rem,4vw,3rem)] text-ink">
          Termos de uso
        </h1>
        <div className="mt-10 space-y-5 text-sm leading-relaxed text-ink-dim [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_strong]:text-ink">
          <p>
            Este documento é um <strong>placeholder</strong> para soft launch.
            Antes de produção comercial ampla, substitua por termos revisados por
            advogado.
          </p>
          <h2>1. Objeto</h2>
          <p>
            O Oficina é um software como serviço (SaaS) multi-tenant para gestão
            de oficinas mecânicas: clientes, veículos, ordens de serviço, estoque,
            ferramentas e assinatura.
          </p>
          <h2>2. Conta e trial</h2>
          <p>
            O período de avaliação é de 14 dias, com cartão informado no cadastro.
            A cobrança inicia após o trial, conforme o plano escolhido (mensal ou
            anual), salvo cancelamento prévio pelo portal de cobrança.
          </p>
          <h2>3. Uso aceitável</h2>
          <p>
            Você é responsável pelos dados inseridos na sua organização e pelo
            uso conforme a legislação aplicável. É proibido tentar acessar dados
            de outras organizações ou abusar da plataforma.
          </p>
          <h2>4. Escopo do produto</h2>
          <p>
            Funcionalidades atuais e limitações (incluindo itens fora de escopo
            como NF-e, multi-filial, app mobile nativo e white-label) estão
            descritas na documentação comercial do produto e podem evoluir com
            aviso razoável.
          </p>
          <h2>5. Contato</h2>
          <p>
            Dúvidas comerciais:{" "}
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
