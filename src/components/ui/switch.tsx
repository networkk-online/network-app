import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-white/[0.08] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary/20 data-[state=checked]:border-primary/30 data-[state=unchecked]:bg-white/[0.04]",
      className
    )}
    style={{
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.04)'
    }}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-all duration-300 data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px] data-[state=checked]:bg-primary data-[state=unchecked]:bg-white/40"
      )}
      style={{
        boxShadow: '0 2px 6px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
      }}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
