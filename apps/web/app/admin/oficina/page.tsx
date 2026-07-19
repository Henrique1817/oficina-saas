import { PageHeader } from "@/components/ui/page-header";
import { WorkshopSettingsForm } from "@/components/actions/workshop-settings-form";
import { getSessionOrRedirect } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function WorkshopSettingsPage() {
  const { role } = await getSessionOrRedirect();
  if (role !== "ADMIN") redirect("/workshop");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Oficina"
        title="Orçamento e WhatsApp"
        description="Nome no PDF, validade do orçamento e modelos de mensagem prontos para o dia a dia."
      />
      <WorkshopSettingsForm />
    </div>
  );
}
