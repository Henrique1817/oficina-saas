import { getSessionOrRedirect } from "@/lib/session";
import { Sidebar } from "./sidebar";
import { pastDueGraceRemainingDays } from "@/server/modules/billing";
import { PastDueBanner } from "@/components/billing/past-due-banner";
import { ImpersonationBanner } from "@/components/billing/impersonation-banner";
import { SupportContactBanner } from "@/components/support-contact-banner";

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
      <main className="relative flex-1 overflow-auto px-6 py-8 md:px-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="mono-label text-ink-mute">{organizationSlug}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
              {profile.fullName}
            </p>
          </div>
          <span className="mono-label border border-line bg-bg-soft px-3 py-1.5 text-signal">
            {role}
          </span>
        </header>
        {impersonating && <ImpersonationBanner orgName={organization.name} />}
        {graceLeft !== null && graceLeft > 0 && <PastDueBanner daysLeft={graceLeft} />}
        <SupportContactBanner compact />
        {children}
      </main>
    </div>
  );
}
