"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AddCustomerButton } from "@/components/actions/add-customer-button";
import { AddPartButton } from "@/components/actions/add-part-button";
import { NewServiceOrderButton } from "@/components/actions/new-service-order-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  canCreateServiceOrders: boolean;
};

export function DashboardQuickActions({ canCreateServiceOrders }: Props) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 font-semibold">Atalhos rápidos</h2>
      <div className="flex flex-wrap gap-3">
        <AddCustomerButton />
        <AddPartButton />
        {canCreateServiceOrders && <NewServiceOrderButton />}
        <Link
          href="/workshop/service-orders"
          className={cn(buttonVariants({ variant: "secondary" }), "inline-flex")}
        >
          Ver ordens de serviço
        </Link>
        <Link
          href="/manager/customers"
          className={cn(buttonVariants({ variant: "secondary" }), "inline-flex")}
        >
          Lista de clientes
        </Link>
        <Link
          href="/manager/parts"
          className={cn(buttonVariants({ variant: "secondary" }), "inline-flex")}
        >
          Lista de peças
        </Link>
      </div>
    </Card>
  );
}
