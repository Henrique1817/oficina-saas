import { redirect } from "next/navigation";
import { getSessionOrRedirect, canManageServiceOrders } from "@/lib/session";
import { CreateServiceOrderForm } from "@/components/actions/create-service-order-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function NewServiceOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; vehicleId?: string }>;
}) {
  const { role } = await getSessionOrRedirect();
  if (!canManageServiceOrders(role)) {
    redirect("/workshop/service-orders");
  }

  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Abrir ordem de serviço"
        description="Cliente, veículo, mecânico e prazo — depois você monta peças, serviços e orçamento no detalhe."
      />
      <CreateServiceOrderForm
        initialCustomerId={params.customerId ?? ""}
        initialVehicleId={params.vehicleId ?? ""}
      />
    </div>
  );
}
