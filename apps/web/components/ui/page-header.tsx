import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="display-lg mt-2 text-[clamp(1.75rem,3vw,2.35rem)] text-ink">
          {title}
        </h1>
        {description ? (
          <div className="mt-2 max-w-xl text-sm leading-relaxed text-ink-dim">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
