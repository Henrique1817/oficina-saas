import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — Oficina",
  description: "Política de privacidade do sistema Oficina",
};

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          ← Voltar ao login
        </Link>
      </p>
      <h1 className="mt-6 text-3xl font-bold">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: 16 de julho de 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Controlador</h2>
          <p>
            Controlador dos dados pessoais tratados nesta plataforma:{" "}
            <strong>[RAZÃO SOCIAL / NOME DO TITULAR]</strong>, CNPJ/CPF <strong>[NÚMERO]</strong>,
            e-mail <strong>[EMAIL]</strong> (“nós”). Esta política descreve como tratamos dados no
            produto <strong>Oficina</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Dados que coletamos</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Conta:</strong> nome, e-mail, credenciais de autenticação, papel na organização.
            </li>
            <li>
              <strong>Cobrança:</strong> dados de assinatura e identificadores do processador de
              pagamento (Stripe); não armazenamos número completo de cartão.
            </li>
            <li>
              <strong>Uso do produto:</strong> logs técnicos, IP, navegador, eventos de erro e
              auditoria operacional necessária ao Serviço.
            </li>
            <li>
              <strong>Dados de negócio do assinante:</strong> clientes finais da oficina, veículos,
              OS, estoque etc., inseridos pelo próprio assinante (tratamento sob instrução do
              assinante).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Finalidades e bases legais (LGPD)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Execução de contrato: prestar o SaaS, autenticação, suporte e cobrança.</li>
            <li>Legítimo interesse: segurança, prevenção a fraude e melhoria do Serviço.</li>
            <li>Cumprimento de obrigação legal: quando exigido por lei ou autoridade.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Compartilhamento</h2>
          <p>
            Podemos compartilhar dados com operadores essenciais: infraestrutura (ex.: Vercel,
            Supabase), autenticação, e-mail transacional e Stripe para pagamentos. Não vendemos
            dados pessoais.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Retenção e segurança</h2>
          <p>
            Mantemos dados enquanto a conta estiver ativa e pelo prazo necessário a obrigações
            legais ou defesa de direitos. Aplicamos medidas técnicas e organizacionais razoáveis;
            nenhum sistema é 100% isento de risco.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. Direitos do titular</h2>
          <p>
            Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção,
            anonimização, portabilidade, eliminação (quando cabível), informação sobre
            compartilhamentos e revogação de consentimento. Contato: <strong>[EMAIL]</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">7. Cookies</h2>
          <p>
            Utilizamos cookies e armazenamento local necessários à sessão de autenticação e
            funcionamento do app. Cookies analíticos, se adotados no futuro, serão descritos aqui.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">8. Alterações</h2>
          <p>
            Podemos atualizar esta política. A data no topo indica a versão vigente. Alterações
            relevantes serão comunicadas pelo Serviço ou e-mail.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Ver também:{" "}
        <Link href="/termos" className="text-primary hover:underline">
          Termos de Uso
        </Link>
      </p>
    </main>
  );
}
