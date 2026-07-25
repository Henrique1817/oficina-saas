import { prisma } from "@oficina/database";

export type TimelineEvent = {
  at: Date;
  kind: string;
  label: string;
  meta?: string;
};

export async function searchSupport(q: string) {
  const query = q.trim();
  if (!query || query.length < 2) return { orgs: [], profiles: [] };

  const [orgs, profiles] = await Promise.all([
    prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { mpPayerId: { contains: query, mode: "insensitive" } },
          { mpPreapprovalId: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 25,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { memberships: true, serviceOrders: true } },
      },
    }),
    prisma.profile.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { fullName: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 25,
      include: {
        memberships: {
          where: { active: true },
          include: {
            organization: { select: { id: true, name: true, slug: true, planStatus: true } },
          },
        },
      },
    }),
  ]);

  return { orgs, profiles };
}

export async function buildOrgTimeline(organizationId: string): Promise<TimelineEvent[]> {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) return [];

  const events: TimelineEvent[] = [];

  events.push({
    at: org.createdAt,
    kind: "signup",
    label: "Oficina criada",
    meta: org.slug,
  });

  if (org.trialEndsAt) {
    events.push({
      at: org.trialEndsAt,
      kind: "trial",
      label: "Fim do trial (programado)",
      meta: org.planStatus === "TRIALING" ? "status atual: TRIALING" : undefined,
    });
  }

  if (org.pastDueAt) {
    events.push({
      at: org.pastDueAt,
      kind: "billing",
      label: "Entrou em PAST_DUE",
    });
  }

  if (org.suspendedAt) {
    events.push({
      at: org.suspendedAt,
      kind: "suspend",
      label: "Suspensa (acesso bloqueado)",
    });
  }

  if (org.mpPreapprovalId) {
    events.push({
      at: org.updatedAt,
      kind: "mercadopago",
      label: "Assinatura Mercado Pago vinculada",
      meta: org.mpPreapprovalId,
    });
  }

  const audits = await prisma.platformAuditLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  for (const a of audits) {
    events.push({
      at: a.createdAt,
      kind: "audit",
      label: a.action,
      meta: `${a.actorEmail}${a.metadata ? ` · ${JSON.stringify(a.metadata)}` : ""}`,
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  return events;
}

export const ACTION_LABEL: Record<string, string> = {
  "org.suspend": "Suspendeu oficina",
  "org.unsuspend": "Reativou oficina",
  "org.extend_trial": "Estendeu trial",
  "org.note": "Atualizou nota interna",
  "org.billing_exempt_on": "Marcou cortesia",
  "org.billing_exempt_off": "Removeu cortesia",
  "impersonate.create_token": "Gerou impersonate",
  "impersonate.end": "Encerrou impersonate",
  "team.invite": "Convidou membro",
  "team.role_change": "Mudou role",
  "team.activate": "Reativou membro",
  "team.deactivate": "Desativou membro",
};
