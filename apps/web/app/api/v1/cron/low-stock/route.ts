import { apiSuccess } from "@oficina/shared";
import { prisma } from "@oficina/database";
import { inventoryRepository } from "@/server/modules/inventory/inventory.repository";
import { sendLowStockEmail } from "@/server/modules/email/send";
import { recordCronRun } from "@/server/modules/platform/cron-run";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const organizations = await prisma.organization.findMany({
    select: { id: true, slug: true, name: true },
  });

  let emailsSent = 0;
  const results = [];

  for (const org of organizations) {
    const lowStock = await inventoryRepository.getLowStockParts(org.id);
    const items = lowStock.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      minQuantity: p.minQuantity,
      available: p.stockItems.reduce((s, i) => s + i.quantity - i.reservedQty, 0),
    }));

    if (items.length > 0) {
      const managers = await prisma.membership.findMany({
        where: {
          organizationId: org.id,
          active: true,
          role: { in: ["ADMIN", "MANAGER"] },
        },
        include: { user: true },
      });
      for (const m of managers) {
        if (!m.user.email) continue;
        const result = await sendLowStockEmail({
          to: m.user.email,
          organizationName: org.name,
          items,
        });
        if (result.sent) emailsSent += 1;
      }
    }

    results.push({
      organizationId: org.id,
      organizationSlug: org.slug,
      count: items.length,
      items,
    });
  }

  const payload = {
    checkedAt: new Date().toISOString(),
    organizations: results,
    totalLowStock: results.reduce((sum, r) => sum + r.count, 0),
    emailsSent,
  };
  await recordCronRun("low-stock", {
    emailsSent,
    totalLowStock: payload.totalLowStock,
    orgs: organizations.length,
  });
  return apiSuccess(payload);
}
