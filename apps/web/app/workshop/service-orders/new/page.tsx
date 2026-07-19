import { redirect } from "next/navigation";
import { getSessionOrRedirect, canManageServiceOrders } from "@/lib/session";
import { CreateServiceOrderForm } from "@/components/actions/create-service-order-form";

export default async function NewServiceOrderPage() {
  const { role } = await getSessionOrRedirect();
  if (!canManageServiceOrders(role)) {
    redirect("/workshop/service-orders");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nova ordem de serviço</h1>
      <p className="text-sm text-muted-foreground">
        Selecione o cliente e o veículo. Gerentes e administradores podem cadastrar novas OS.
      </p>
      <CreateServiceOrderForm />
    </div>
  );
}
