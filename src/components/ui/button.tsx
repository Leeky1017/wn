import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "./utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#007acc] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-[#007acc] text-white hover:bg-[#005a9e] active:bg-[#004c87] shadow-sm",
        secondary:
          "bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4c4c4c] active:bg-[#505050]",
        ghost: "hover:bg-[#2a2d2e] text-[#cccccc] active:bg-[#323436]",
        icon: "hover:bg-[#2a2d2e] text-[#888888] hover:text-[#cccccc] active:bg-[#323436]",
        outline:
          "border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]",
      },
      size: {
        default: "h-9 px-4 py-2 text-[13px]",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-10 px-6 text-[14px]",
        icon: "h-8 w-8",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
