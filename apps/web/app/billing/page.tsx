import Link from "next/link";
import { getSessionOrRedirect } from "@/lib/session";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
import { organizationHasAccess, pastDueGraceRemainingDays } from "@/server/modules/billing";
import { Card } from "@/components/ui/card";
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
        <p>Organização não encontrada.</p>
      </main>
    );
  }

  const hasAccess = organizationHasAccess(org);
  const graceLeft = pastDueGraceRemainingDays(org);

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="mt-1 text-sm text-muted-foreground">{org.name}</p>
      </div>

      {params.checkout === "canceled" && (
        <p className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
          Checkout cancelado. Você pode tentar de novo quando quiser.
        </p>
      )}
      {params.checkout === "success" && (
        <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm">
          Cartão cadastrado. Trial de 14 dias ativo.
        </p>
      )}

      <Card className="space-y-3">
        <p className="text-sm">
          Status:{" "}
          <strong>{STATUS_LABEL[org.planStatus] ?? org.planStatus}</strong>
        </p>
        {org.trialEndsAt && (
          <p className="text-sm text-muted-foreground">
            Trial até {org.trialEndsAt.toLocaleDateString("pt-BR")}
          </p>
        )}
        {graceLeft !== null && graceLeft > 0 && (
          <p className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
            Pagamento pendente — cerca de <strong>{graceLeft} dia(s)</strong> de acesso soft
            restantes. Atualize o cartão para evitar o bloqueio.
          </p>
        )}
        {!hasAccess && (
          <p className="text-sm text-danger">
            Acesso ao sistema bloqueado até regularizar a assinatura.
          </p>
        )}
        <BillingActions
          canManage={session.role === "ADMIN"}
          hasStripeCustomer={Boolean(org.stripeCustomerId)}
        />
      </Card>

      {hasAccess && (
        <p className="text-sm">
          <Link href="/workshop" className="text-primary hover:underline">
            ← Voltar à oficina
          </Link>
        </p>
      )}
    </main>
  );
}
