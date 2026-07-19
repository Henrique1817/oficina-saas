import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-line bg-bg-panel p-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hot,
  className,
}: {
  label: string;
  value: ReactNode;
  hot?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("bg-bg/70", className)}>
      <p className="mono-label text-ink-mute">{label}</p>
      <p
        className={cn(
          "mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight",
          hot ? "text-signal" : "text-ink",
        )}
      >
        {value}
      </p>
    </Card>
  );
}
