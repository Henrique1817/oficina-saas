import { requirePlatformSession } from "@/lib/session";
import { ConsoleSidebar } from "@/components/console-sidebar";

export async function ConsoleShell({ children }: { children: React.ReactNode }) {
  const session = await requirePlatformSession();

  return (
    <div className="flex min-h-screen">
      <ConsoleSidebar email={session.email} role={session.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-8 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Equipe Oficina</p>
            <p className="font-medium">{session.fullName}</p>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
