import { userRepository } from "@/server/modules/users/user.repository";
import { inviteRepository } from "@/server/modules/users/invite.repository";
import { Card } from "@/components/ui/card";
import { getSessionOrRedirect } from "@/lib/session";
import { InviteUserButton } from "@/components/actions/invite-user-button";
import { UserRoleSelect } from "@/components/actions/user-role-select";

export default async function UsersPage() {
  const { organizationId } = await getSessionOrRedirect();
  const [users, invites] = await Promise.all([
    userRepository.list(organizationId),
    inviteRepository.listPending(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <InviteUserButton />
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2">Nome</th>
              <th className="pb-2">E-mail</th>
              <th className="pb-2">Função</th>
              <th className="pb-2">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="py-3">{u.fullName}</td>
                <td className="py-3">{u.email}</td>
                <td className="py-3">
                  <UserRoleSelect userId={u.id} currentRole={u.role} />
                </td>
                <td className="py-3">{u.active ? "Sim" : "Não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {invites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Convites pendentes</h2>
          <Card>
            <ul className="divide-y divide-border text-sm">
              {invites.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span>
                    {inv.email} · {inv.role}
                  </span>
                  <code className="text-xs text-muted-foreground">/invite/{inv.token}</code>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
