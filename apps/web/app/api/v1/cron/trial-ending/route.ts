import { prisma } from "@oficina/database";
import { sendTrialEndingEmail } from "@/server/modules/email/send";
import { apiError, apiSuccess } from "@oficina/shared";
import { recordCronRun } from "@/server/modules/platform/cron-run";

export const runtime = "nodejs";

/**
 * Dispara e-mails de “trial acaba em 3 dias”.
 * Protegido por CRON_SECRET (igual ao low-stock).
 * Agende no Vercel: 0 9 * * * → /api/v1/cron/trial-ending
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return apiError("Unauthorized", 401);
  }

  const in3DaysStart = new Date();
  in3DaysStart.setHours(0, 0, 0, 0);
  in3DaysStart.setDate(in3DaysStart.getDate() + 3);
  const in3DaysEnd = new Date(in3DaysStart);
  in3DaysEnd.setHours(23, 59, 59, 999);

  const orgs = await prisma.organization.findMany({
    where: {
      planStatus: "TRIALING",
      billingExempt: false,
      trialEndsAt: { gte: in3DaysStart, lte: in3DaysEnd },
    },
  });

  let sent = 0;
  for (const org of orgs) {
    if (!org.trialEndsAt) continue;
    const admin = await prisma.membership.findFirst({
      where: { organizationId: org.id, role: "ADMIN", active: true },
      include: { user: true },
    });
    if (!admin?.user.email) continue;
    const result = await sendTrialEndingEmail({
      to: admin.user.email,
      organizationName: org.name,
      trialEndsAt: org.trialEndsAt,
    });
    if (result.sent) sent += 1;
  }

  const payload = { orgs: orgs.length, emailsSent: sent };
  await recordCronRun("trial-ending", payload);
  return apiSuccess(payload);
}
