import * as React from "react"
import { cn } from "@/lib/utils"

export interface SROnlyProps extends React.HTMLAttributes<HTMLSpanElement> {}

const SROnly = React.forwardRef<HTMLSpanElement, SROnlyProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "sr-only",
        className
      )}
      {...props}
    />
  )
)
SROnly.displayName = "SROnly"

export { SROnly }
