import { notFound } from "next/navigation";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
import { QuotePrintView } from "@/components/service-orders/quote-print-view";
import { getSessionOrRedirect } from "@/lib/session";

export default async function ServiceOrderQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { organizationId } = await getSessionOrRedirect();
  const { id } = await params;
  const [order, org] = await Promise.all([
    serviceOrderRepository.getById(organizationId, id),
    organizationRepository.findById(organizationId),
  ]);
  if (!order || !org) notFound();

  return (
    <QuotePrintView
      order={order}
      workshop={{
        name: org.name,
        phone: org.phone,
        email: org.email,
        address: org.address,
        quoteValidityDays: org.quoteValidityDays,
        whatsappTemplates: org.whatsappTemplates,
      }}
    />
  );
}
