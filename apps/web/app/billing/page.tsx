import Link from "next/link";
import { getSessionOrRedirect } from "@/lib/session";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
import { organizationHasAccess, pastDueGraceRemainingDays } from "@/server/modules/billing";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { BillingActions } from "@/components/actions/billing-actions";

const STATUS_LABEL: Record<string, string> = {
  TRIALING: "Em trial",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento pendente",
  CANCELED: "Cancelada",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await getSessionOrRedirect();
  const org = await organizationRepository.findById(session.organizationId);
  const params = await searchParams;

  if (!org) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-ink-dim">Organização não encontrada.</p>
      </main>
    );
  }

  const hasAccess = organizationHasAccess(org);
  const graceLeft = pastDueGraceRemainingDays(org);

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-12">
      <PageHeader eyebrow="Assinatura" title="Plano e cobrança" description={org.name} />

      {params.checkout === "canceled" && (
        <p className="border border-signal/40 bg-signal/10 px-3 py-2 text-sm text-ink-dim">
          Checkout cancelado. Você pode tentar de novo quando quiser.
        </p>
      )}
      {params.checkout === "success" && (
        <p className="border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ink-dim">
          Assinatura autorizada no Mercado Pago. Trial de 14 dias ativo.
        </p>
      )}

      <Card className="space-y-3">
        <p className="text-sm text-ink-dim">
          Status:{" "}
          <strong className="text-signal">
            {STATUS_LABEL[org.planStatus] ?? org.planStatus}
          </strong>
        </p>
        {org.trialEndsAt && (
          <p className="text-sm text-ink-mute">
            Trial até {org.trialEndsAt.toLocaleDateString("pt-BR")}
          </p>
        )}
        {graceLeft !== null && graceLeft > 0 && (
          <p className="border border-signal/40 bg-signal/10 px-3 py-2 text-sm text-ink-dim">
            Pagamento pendente — cerca de{" "}
            <strong className="text-signal">{graceLeft} dia(s)</strong> de acesso soft
            restantes. Regularize o pagamento no Mercado Pago para evitar o bloqueio.
          </p>
        )}
        {!hasAccess && (
          <p className="text-sm text-alert">
            Acesso ao sistema bloqueado até regularizar a assinatura.
          </p>
        )}
        <BillingActions
          canManage={session.role === "ADMIN"}
          hasSubscription={Boolean(org.mpPreapprovalId)}
        />
      </Card>

      {hasAccess && (
        <p className="text-center text-sm text-ink-mute">
          <Link href="/workshop" className="text-signal hover:underline">
            ← Voltar à oficina
          </Link>
        </p>
      )}
    </main>
  );
}
