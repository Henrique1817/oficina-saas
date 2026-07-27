import { userRepository } from "@/server/modules/users/user.repository";
import { inviteRepository } from "@/server/modules/users/invite.repository";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSessionOrRedirect } from "@/lib/session";
import { InviteUserButton } from "@/components/actions/invite-user-button";
import { CancelInviteButton } from "@/components/actions/cancel-invite-button";
import { UserRoleSelect } from "@/components/actions/user-role-select";

export default async function UsersPage() {
  const { organizationId } = await getSessionOrRedirect();
  const [users, invites] = await Promise.all([
    userRepository.list(organizationId),
    inviteRepository.listPending(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Equipe"
        title="Usuários"
        description="Admin, Gerente ou Mecânico — um e-mail, um papel por oficina."
        actions={<InviteUserButton />}
      />

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="mono-label px-6 pb-3 pt-5 text-ink-mute">Nome</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">E-mail</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Função</th>
                <th className="mono-label px-6 pb-3 pt-5 text-ink-mute">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line/60">
                  <td className="px-6 py-4 font-medium text-ink">{u.fullName}</td>
                  <td className="px-3 py-4 text-ink-dim">{u.email}</td>
                  <td className="px-3 py-4">
                    <UserRoleSelect userId={u.id} currentRole={u.role} />
                  </td>
                  <td className="px-6 py-4 text-ink-dim">{u.active ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {invites.length > 0 && (
        <div className="space-y-3">
          <h2 className="mono-label text-signal">Convites pendentes</h2>
          <Card className="p-0">
            <ul className="divide-y divide-line text-sm">
              {invites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-ink-dim">
                      {inv.email} · <span className="text-signal">{inv.role}</span>
                    </p>
                    <code className="break-all font-[family-name:var(--font-mono)] text-xs text-ink-mute">
                      /invite/{inv.token}
                    </code>
                  </div>
                  <CancelInviteButton inviteId={inv.id} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
