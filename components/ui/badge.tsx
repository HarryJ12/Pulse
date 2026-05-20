import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]",
        accent:
          "border-[rgba(16,194,129,0.35)] bg-[var(--accent-muted)] text-[var(--accent-strong)]",
        success:
          "border-[rgba(143,214,148,0.32)] bg-[rgba(143,214,148,0.1)] text-[var(--success)]",
        warning:
          "border-[rgba(246,198,107,0.32)] bg-[rgba(246,198,107,0.1)] text-[var(--warning)]",
        danger:
          "border-[rgba(255,143,154,0.32)] bg-[rgba(255,143,154,0.1)] text-[var(--danger)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}
