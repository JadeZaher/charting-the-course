import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border-2 text-sm font-bold transition-[background-color,color,border-color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        outline:
          "border-control-border bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        secondary:
          "border-control-border bg-secondary text-secondary-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        ghost:
          "border-transparent bg-transparent text-foreground hover:border-control-border hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-11 px-3 py-2 text-xs",
        lg: "min-h-12 px-7 py-3 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
