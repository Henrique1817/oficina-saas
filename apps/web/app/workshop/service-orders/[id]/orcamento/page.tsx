import { notFound } from "next/navigation";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";
import { QuotePrintView } from "@/components/service-orders/quote-print-view";
import { getSessionOrRedirect } from "@/lib/session";

export default async function ServiceOrderQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { organizationId } = await getSessionOrRedirect();
  const { id } = await params;
  const order = await serviceOrderRepository.getById(organizationId, id);
  if (!order) notFound();

  return <QuotePrintView order={order} />;
}
