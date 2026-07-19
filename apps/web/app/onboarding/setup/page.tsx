import { getSessionOrRedirect } from "@/lib/session";
import { prisma } from "@oficina/database";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { redirect } from "next/navigation";

export default async function OnboardingSetupPage() {
  const session = await getSessionOrRedirect();
  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
  });
  if (!org) redirect("/onboarding");

  const [customerCount, orderCount] = await Promise.all([
    prisma.customer.count({ where: { organizationId: org.id } }),
    prisma.serviceOrder.count({ where: { organizationId: org.id } }),
  ]);

  return (
    <OnboardingWizard
      organizationName={org.name}
      hasCustomer={customerCount > 0}
      hasServiceOrder={orderCount > 0}
    />
  );
}
