import Link from "next/link";
import { isPlatformComingSoon, loginUrl, signupUrl } from "@/lib/site";

type CtaProps = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "line";
  className?: string;
  external?: boolean;
};

const variants = {
  primary:
    "bg-signal text-bg hover:bg-signal-bright focus-visible:outline-signal",
  ghost:
    "bg-transparent text-ink border border-line-strong hover:border-signal hover:text-signal",
  line: "bg-transparent text-ink-dim underline-offset-4 hover:text-ink hover:underline",
} as const;

const comingSoonVariants = {
  primary: "bg-signal/40 text-bg cursor-not-allowed",
  ghost:
    "bg-transparent text-ink-mute border border-line cursor-not-allowed",
  line: "bg-transparent text-ink-mute cursor-not-allowed no-underline",
} as const;

function ctaClasses(
  variant: keyof typeof variants,
  className: string,
  comingSoon = false,
) {
  return [
    "inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold tracking-wide transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    comingSoon ? comingSoonVariants[variant] : variants[variant],
    className,
  ].join(" ");
}

/** Botão/link visual desabilitado — não navega. */
export function ComingSoonCta({
  variant = "primary",
  className = "",
}: {
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={ctaClasses(variant, className, true)}
      aria-disabled="true"
      title="Em breve"
    >
      Em Breve
    </span>
  );
}

export function CtaLink({
  href,
  children,
  variant = "primary",
  className = "",
  external,
}: CtaProps) {
  const resolved = href ?? signupUrl();
  const isExternal =
    external ?? (resolved.startsWith("http") || resolved.startsWith("https"));

  const classes = ctaClasses(variant, className);

  if (isExternal) {
    return (
      <a
        href={resolved}
        className={classes}
        data-cursor="hot"
        rel={
          resolved.includes(loginUrl()) || resolved.includes(signupUrl())
            ? undefined
            : "noopener noreferrer"
        }
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={resolved} className={classes} data-cursor="hot">
      {children}
    </Link>
  );
}

export function TrialCta({ className = "" }: { className?: string }) {
  if (isPlatformComingSoon()) {
    return <ComingSoonCta className={className} />;
  }

  return (
    <CtaLink href={signupUrl()} className={className} external>
      Começar 14 dias grátis
    </CtaLink>
  );
}
