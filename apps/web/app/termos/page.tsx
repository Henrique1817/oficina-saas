import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso — Oficina",
  description: "Termos de uso do sistema Oficina",
};

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          ← Voltar ao login
        </Link>
      </p>
      <h1 className="mt-6 text-3xl font-bold">Termos de Uso</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: 16 de julho de 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Objeto</h2>
          <p>
            Estes Termos regem o uso da plataforma <strong>Oficina</strong> (“Serviço”), software
            de gestão para oficinas mecânicas oferecido em modelo de assinatura (SaaS). Ao criar
            conta ou utilizar o Serviço, você concorda com estes Termos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Prestador</h2>
          <p>
            Prestador: <strong>[RAZÃO SOCIAL / NOME DO TITULAR]</strong>, CNPJ/CPF{" "}
            <strong>[NÚMERO]</strong>, e-mail de contato <strong>[EMAIL]</strong>. Substitua estes
            placeholders antes do lançamento comercial.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Conta e acesso</h2>
          <p>
            Você é responsável por manter a confidencialidade das credenciais e por toda atividade
            realizada sob sua conta e organização. O acesso pode ser suspenso em caso de inadimplência,
            abuso ou violação destes Termos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Assinatura e cobrança</h2>
          <p>
            Planos, preços e período de trial são informados no momento da contratação. Cobranças
            recorrentes são processadas por processador de pagamento terceirizado (Mercado Pago). Cancelamentos
            e reembolsos seguem as regras do plano vigente e a legislação aplicável.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Dados e conteúdo do cliente</h2>
          <p>
            Os dados inseridos (clientes, veículos, ordens de serviço, estoque etc.) pertencem a você.
            Você declara ter base legal para tratamento desses dados. O Prestador trata os dados conforme
            a{" "}
            <Link href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. Disponibilidade e suporte</h2>
          <p>
            O Serviço é prestado “como está”, com esforço razoável de disponibilidade. Manutenções
            programadas e interrupções podem ocorrer. O suporte no MVP é prestado por canais indicados
            pelo Prestador, em horário comercial.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">7. Limitação de responsabilidade</h2>
          <p>
            Na máxima extensão permitida pela lei, o Prestador não responde por lucros cessantes,
            perda de dados decorrente de uso inadequado, ou decisões operacionais tomadas com base no
            Serviço. A responsabilidade total, quando aplicável, limita-se ao valor pago nos últimos
            12 meses.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">8. Alterações</h2>
          <p>
            Podemos atualizar estes Termos. Alterações relevantes serão comunicadas pelo Serviço ou
            e-mail. O uso continuado após a vigência constitui aceitação.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">9. Foro</h2>
          <p>
            Aplica-se a legislação brasileira. Fica eleito o foro da comarca de{" "}
            <strong>[CIDADE/UF]</strong>, com renúncia a qualquer outro.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Ver também:{" "}
        <Link href="/privacidade" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
      </p>
    </main>
  );
}
