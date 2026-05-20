import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "pulse-focus inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-medium transition-[background,border-color,color,transform] duration-150 ease-[var(--ease-standard)] disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border border-[var(--accent)] bg-[var(--accent)] text-[#041111] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]",
        secondary:
          "border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--text-primary)] hover:-translate-y-0.5 hover:bg-[var(--surface-muted)]",
        ghost:
          "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
        danger:
          "border border-[rgba(255,143,154,0.35)] bg-[rgba(255,143,154,0.1)] text-[var(--danger)] hover:-translate-y-0.5 hover:bg-[rgba(255,143,154,0.16)]",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
