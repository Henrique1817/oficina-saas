import Link from "next/link";
import { getProfileOrRedirect } from "@/lib/session";
import { prisma } from "@oficina/database";
import { redirect } from "next/navigation";
import { CreateWorkshopForm } from "@/components/actions/create-workshop-form";

export default async function OnboardingPage() {
  const profile = await getProfileOrRedirect();
  const membership = await prisma.membership.findFirst({
    where: { userId: profile.id, active: true },
  });
  if (membership) redirect("/onboarding/setup");

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold">Bem-vindo ao Oficina</h1>
      <p className="mt-3 text-muted-foreground">
        Conta: <strong className="text-foreground">{profile.email}</strong>
      </p>

      <div className="mt-8 space-y-4">
        <h2 className="font-semibold">Criar sua oficina</h2>
        <p className="text-sm text-muted-foreground">
          14 dias grátis com cartão no cadastro. Depois cobramos automaticamente.
        </p>
        <CreateWorkshopForm />
      </div>

      <ul className="mt-8 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>
          Foi convidado? Abra o link <code className="rounded bg-muted px-1">/invite/…</code>
        </li>
      </ul>

      <p className="mt-8 text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </main>
  );
}
