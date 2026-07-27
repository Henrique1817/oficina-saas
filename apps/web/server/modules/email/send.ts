import { Resend } from "resend";
import { getAppUrl } from "@/server/modules/billing/config";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.includes("placeholder")) return null;
  return new Resend(key);
}

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? "Oficina <onboarding@resend.dev>";
}

function appUrlSafe() {
  try {
    return getAppUrl();
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  }
}

export async function sendInviteEmail(input: {
  to: string;
  organizationName: string;
  acceptUrl: string;
  role: string;
  invitedByName?: string | null;
  invitePageUrl?: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.info("[email] RESEND_API_KEY ausente — convite só com link:", input.acceptUrl);
    return { sent: false as const };
  }

  const { buildInviteEmailHtml } = await import("./invite-template");
  const html = buildInviteEmailHtml({
    organizationName: input.organizationName,
    roleLabel: input.role,
    magicUrl: input.acceptUrl,
    invitePageUrl: input.invitePageUrl,
    invitedByName: input.invitedByName,
  });

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: `Convite para ${input.organizationName} — Oficina`,
    html,
  });

  if (error) {
    console.error("[email] invite failed", error);
    return { sent: false as const, error };
  }
  return { sent: true as const };
}

export async function sendTrialEndingEmail(input: {
  to: string;
  organizationName: string;
  trialEndsAt: Date;
}) {
  const resend = getResend();
  if (!resend) return { sent: false as const };

  const when = input.trialEndsAt.toLocaleDateString("pt-BR");
  const billingUrl = `${appUrlSafe()}/billing`;

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: `Seu trial da ${input.organizationName} acaba em breve`,
    html: `
      <p>O período de avaliação da oficina <strong>${input.organizationName}</strong> termina em <strong>${when}</strong>.</p>
      <p>Confira a assinatura em <a href="${billingUrl}">${billingUrl}</a>.</p>
    `,
  });

  if (error) {
    console.error("[email] trial ending failed", error);
    return { sent: false as const, error };
  }
  return { sent: true as const };
}

export async function sendPaymentFailedEmail(input: {
  to: string;
  organizationName: string;
  graceDaysLeft?: number;
}) {
  const resend = getResend();
  if (!resend) return { sent: false as const };

  const billingUrl = `${appUrlSafe()}/billing`;
  const graceNote =
    typeof input.graceDaysLeft === "number"
      ? `<p>Você ainda tem cerca de <strong>${input.graceDaysLeft} dia(s)</strong> de acesso antes do bloqueio.</p>`
      : "";

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: `Pagamento pendente — ${input.organizationName}`,
    html: `
      <p>Não conseguimos processar o pagamento da oficina <strong>${input.organizationName}</strong>.</p>
      ${graceNote}
      <p>Atualize o cartão em <a href="${billingUrl}">${billingUrl}</a> para manter o acesso.</p>
    `,
  });

  if (error) {
    console.error("[email] payment failed mail error", error);
    return { sent: false as const, error };
  }
  return { sent: true as const };
}

export async function sendLowStockEmail(input: {
  to: string;
  organizationName: string;
  items: { sku: string; name: string; available: number; minQuantity: number }[];
}) {
  const resend = getResend();
  if (!resend) return { sent: false as const };

  const rows = input.items
    .slice(0, 20)
    .map(
      (i) =>
        `<li><code>${i.sku}</code> ${i.name} — disponível ${i.available} (mín. ${i.minQuantity})</li>`,
    )
    .join("");

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: `Estoque baixo — ${input.organizationName}`,
    html: `
      <p>A oficina <strong>${input.organizationName}</strong> tem ${input.items.length} peça(s) abaixo do mínimo:</p>
      <ul>${rows}</ul>
      <p>Acesse o estoque no Oficina para repor.</p>
    `,
  });

  if (error) {
    console.error("[email] low stock failed", error);
    return { sent: false as const, error };
  }
  return { sent: true as const };
}
