"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function NewServiceOrderButton({ className }: Props) {
  return (
    <Link
      href="/workshop/service-orders/new"
      className={cn(buttonVariants({ variant: "default" }), className)}
    >
      Nova ordem de serviço
    </Link>
  );
}
