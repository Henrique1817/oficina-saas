import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] text-sm font-semibold tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-signal text-bg hover:bg-signal-bright",
        secondary:
          "border border-line-strong bg-transparent text-ink hover:border-signal hover:text-signal",
        danger: "bg-alert text-ink hover:opacity-90",
        ghost: "text-ink-dim hover:bg-bg-soft hover:text-ink",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-7",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export { buttonVariants };

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
