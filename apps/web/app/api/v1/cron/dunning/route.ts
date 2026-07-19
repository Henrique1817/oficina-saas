import { apiError, apiSuccess } from "@oficina/shared";
import { prisma } from "@oficina/database";
import { pastDueGraceRemainingDays } from "@/server/modules/billing";
import { sendPaymentFailedEmail } from "@/server/modules/email/send";
import { recordCronRun } from "@/server/modules/platform/cron-run";

export const runtime = "nodejs";

/** Dunning diário: relembra PAST_DUE ainda na janela soft. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return apiError("Unauthorized", 401);
  }

  const orgs = await prisma.organization.findMany({
    where: { planStatus: "PAST_DUE", billingExempt: false },
  });

  let emailed = 0;
  for (const org of orgs) {
    const left = pastDueGraceRemainingDays(org);
    if (left === null || left <= 0) continue;

    const admin = await prisma.membership.findFirst({
      where: { organizationId: org.id, role: "ADMIN", active: true },
      include: { user: true },
    });
    if (!admin?.user.email) continue;

    const result = await sendPaymentFailedEmail({
      to: admin.user.email,
      organizationName: org.name,
      graceDaysLeft: left,
    });
    if (result.sent) emailed += 1;
  }

  const payload = {
    pastDue: orgs.length,
    emailsSent: emailed,
    checkedAt: new Date().toISOString(),
  };
  await recordCronRun("dunning", payload);
  return apiSuccess(payload);
}
