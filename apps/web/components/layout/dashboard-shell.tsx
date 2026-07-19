import { getSessionOrRedirect } from "@/lib/session";
import { Sidebar } from "./sidebar";
import { pastDueGraceRemainingDays } from "@/server/modules/billing";
import { PastDueBanner } from "@/components/billing/past-due-banner";
import { ImpersonationBanner } from "@/components/billing/impersonation-banner";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile, role, organizationSlug, organization, impersonating } =
    await getSessionOrRedirect();
  const platformEmails = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isPlatformAdmin = platformEmails.includes(profile.email.toLowerCase());
  const graceLeft = pastDueGraceRemainingDays(organization);

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} isPlatformAdmin={isPlatformAdmin} />
      <main className="flex-1 overflow-auto p-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bem-vindo · {organizationSlug}</p>
            <p className="font-semibold">{profile.fullName}</p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{role}</span>
        </header>
        {impersonating && <ImpersonationBanner orgName={organization.name} />}
        {graceLeft !== null && graceLeft > 0 && <PastDueBanner daysLeft={graceLeft} />}
        {children}
      </main>
    </div>
  );
}
