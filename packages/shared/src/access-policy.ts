/** Espelha PlanStatus do Prisma — evita acoplar @oficina/shared ao database. */
export type AccessPlanStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

/** Dias de acesso “soft” após PAST_DUE antes do bloqueio duro. */
export const PAST_DUE_GRACE_DAYS = 3;

export function organizationHasAccess(org: {
  planStatus: AccessPlanStatus;
  trialEndsAt: Date | null;
  pastDueAt?: Date | null;
  suspendedAt?: Date | null;
  billingExempt?: boolean | null;
  mpPreapprovalId?: string | null;
}): boolean {
  if (org.suspendedAt) return false;
  if (org.billingExempt) return true;

  if (org.planStatus === "ACTIVE") return true;

  if (org.planStatus === "TRIALING") {
    if (org.trialEndsAt && org.trialEndsAt.getTime() < Date.now()) {
      return false;
    }
    return true;
  }

  if (org.planStatus === "PAST_DUE") {
    const since = org.pastDueAt?.getTime() ?? Date.now();
    const graceMs = PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - since < graceMs;
  }

  return false; // CANCELED
}

export function pastDueGraceRemainingDays(org: {
  planStatus: AccessPlanStatus;
  pastDueAt?: Date | null;
}): number | null {
  if (org.planStatus !== "PAST_DUE") return null;
  const since = org.pastDueAt?.getTime() ?? Date.now();
  const graceMs = PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
  const left = graceMs - (Date.now() - since);
  if (left <= 0) return 0;
  return Math.ceil(left / (24 * 60 * 60 * 1000));
}
