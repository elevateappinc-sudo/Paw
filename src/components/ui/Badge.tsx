import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        success: "bg-[#22C55E33] text-[#22C55E]",
        warning: "bg-[#F59E0B33] text-[#F59E0B]",
        error: "bg-[#EF444433] text-[#EF4444]",
        info: "bg-[#3B82F633] text-[#3B82F6]",
        neutral: "bg-[#6B728033] text-[#6B7280]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className = "", variant, children, ...props }: BadgeProps) {
  return (
    <span className={badgeVariants({ variant, className })} {...props}>
      {children}
    </span>
  );
}
