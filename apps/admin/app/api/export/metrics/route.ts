import { requirePlatformSession } from "@/lib/session";
import {
  loadPlatformHealth,
  metricsCsvFromHealth,
} from "@/lib/platform-health";

export const runtime = "nodejs";

/** Export 1-click — substitui atualização manual de ops/metrics.csv. */
export async function GET() {
  await requirePlatformSession();
  const health = await loadPlatformHealth();
  const csv = metricsCsvFromHealth(health);
  const week = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="metrics-${week}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
