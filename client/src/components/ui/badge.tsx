import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex min-h-6 items-center whitespace-nowrap rounded-[1px] border-2 px-2 py-0.5 text-[0.625rem] font-extrabold uppercase leading-none tracking-[0.12em]",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground",
        secondary: "border-control-border bg-secondary text-secondary-foreground",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground",
        success: "border-success bg-success text-success-foreground",
        warning: "border-warning bg-warning text-warning-foreground",
        info: "border-info bg-info text-info-foreground",
        outline: "border-control-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }
