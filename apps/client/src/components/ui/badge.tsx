import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gold/15 text-gold",
        success: "bg-emerald-500/12 text-emerald-400",
        warning: "bg-amber-500/12 text-amber-400",
        danger: "bg-red-500/12 text-red-400",
        info: "bg-blue-500/12 text-blue-400",
        muted: "bg-white/5 text-slate-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
