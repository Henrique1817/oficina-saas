import Link from "next/link";
import { inviteRepository } from "@/server/modules/users/invite.repository";
import { createClient } from "@/lib/supabase/server";
import { AcceptInviteButton } from "@/components/actions/accept-invite-button";
import { Card } from "@/components/ui/card";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await inviteRepository.getByToken(token);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!invite) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-xl font-bold">Convite inválido</h1>
        <p className="mt-2 text-sm text-muted-foreground">Este link não existe ou foi removido.</p>
      </main>
    );
  }

  const expired = invite.expiresAt < new Date();
  const used = Boolean(invite.acceptedAt);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Card className="space-y-4 p-6">
        <h1 className="text-xl font-bold">Convite para {invite.organization.name}</h1>
        <p className="text-sm text-muted-foreground">
          E-mail: <strong className="text-foreground">{invite.email}</strong>
          <br />
          Função: <strong className="text-foreground">{invite.role}</strong>
        </p>
        {used && <p className="text-sm text-accent">Este convite já foi aceito.</p>}
        {expired && !used && <p className="text-sm text-danger">Este convite expirou.</p>}
        {!user && !used && !expired && (
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`}
              className="text-primary hover:underline"
            >
              Entre
            </Link>{" "}
            com o e-mail convidado para aceitar.
          </p>
        )}
        {user && !used && !expired && <AcceptInviteButton token={token} />}
      </Card>
    </main>
  );
}
