import { prisma } from "@oficina/database";
import { Card } from "@/components/ui/card";
import { requirePlatformSession } from "@/lib/session";
import { hasCapability, PLATFORM_ROLE_LABEL, PlatformCapability } from "@/lib/roles";
import { EquipeInviteForm, EquipeMemberRow } from "./team-controls";

export default async function EquipePage() {
  const session = await requirePlatformSession();
  const canManage = hasCapability(session.role, PlatformCapability.manageTeam);
  const members = await prisma.platformUser.findMany({
    orderBy: [{ active: "desc" }, { role: "asc" }, { email: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold tracking-tight">
          Equipe
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem acessa o console · seu role:{" "}
          <strong>{PLATFORM_ROLE_LABEL[session.role]}</strong>
        </p>
      </div>

      <Card className="space-y-2 text-sm">
        <h2 className="font-semibold">Permissões</h2>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Owner</strong> — tudo (equipe, tenants, $,
            impersonate)
          </li>
          <li>
            <strong className="text-foreground">Suporte</strong> — oficinas + impersonate (sem
            cortesia)
          </li>
          <li>
            <strong className="text-foreground">Financeiro</strong> — pagamentos / cortesia
          </li>
          <li>
            <strong className="text-foreground">Viewer</strong> — só leitura
          </li>
        </ul>
      </Card>

      <Card className="space-y-2 text-sm">
        <h2 className="font-semibold">Segurança</h2>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            Ative MFA (2FA) no Supabase Auth para contas da equipe.
          </li>
          <li>
            Cookie de sessão do console: <code className="text-xs">oficina-admin-auth</code>{" "}
            (separado do web).
          </li>
          <li>
            Allowlist de IP opcional: <code className="text-xs">PLATFORM_ADMIN_IPS</code>
          </li>
        </ul>
      </Card>

      {canManage && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Convidar / reativar</h2>
          <p className="text-xs text-muted-foreground">
            A pessoa precisa ter conta no mesmo Supabase (login do produto). No primeiro acesso ao
            console o <code>user_id</code> é vinculado.
          </p>
          <EquipeInviteForm />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-semibold">Membros</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-3">E-mail</th>
                <th className="pb-2 pr-3">Role</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <EquipeMemberRow
                  key={m.id}
                  id={m.id}
                  email={m.email}
                  role={m.role}
                  active={m.active}
                  linked={Boolean(m.userId)}
                  canManage={canManage}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
