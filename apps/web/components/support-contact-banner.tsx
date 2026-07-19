import { getSupportContact } from "@/lib/support-contact";

/** Faixa compacta: falar com a equipe Oficina (WhatsApp / e-mail). */
export function SupportContactBanner({ compact = false }: { compact?: boolean }) {
  const { waLink, email, available } = getSupportContact();
  if (!available) return null;

  return (
    <div
      className={
        compact
          ? "mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 border border-line bg-bg-panel px-3 py-2 text-xs text-ink-dim"
          : "mb-6 flex flex-wrap items-center justify-between gap-3 border border-signal/30 bg-signal/5 px-4 py-3 text-sm text-ink"
      }
    >
      <p>
        {compact ? "Suporte" : "Travou no dia a dia?"}{" "}
        <span className="text-ink-mute">
          {compact ? "— falar com a equipe" : "Fale com quem te onboardou."}
        </span>
      </p>
      <div className="flex flex-wrap gap-3">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-signal underline-offset-2 hover:underline"
          >
            WhatsApp
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}?subject=${encodeURIComponent("Ajuda Oficina")}`}
            className="font-semibold text-signal underline-offset-2 hover:underline"
          >
            E-mail
          </a>
        )}
      </div>
    </div>
  );
}
