import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-glass-border bg-white/4 px-3.5 py-2 text-sm text-slate-100",
          "placeholder:text-slate-500 transition-colors duration-200",
          "focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
