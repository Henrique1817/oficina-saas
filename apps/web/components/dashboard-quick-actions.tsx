"use client";

import Link from "next/link";
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
    <div className="flex flex-wrap items-center gap-2 border border-line bg-bg-panel p-4">
      <p className="mono-label mr-2 text-ink-mute">Atalhos</p>
      <AddCustomerButton />
      <AddPartButton />
      {canCreateServiceOrders && <NewServiceOrderButton />}
      <Link
        href="/workshop/service-orders"
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "inline-flex")}
      >
        Ver OS
      </Link>
      <Link
        href="/manager/customers"
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "inline-flex")}
      >
        Clientes
      </Link>
      <Link
        href="/manager/parts"
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "inline-flex")}
      >
        Peças
      </Link>
    </div>
  );
}
