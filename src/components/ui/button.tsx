import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-spotify-green-light text-white shadow-lg hover:bg-spotify-green-dark font-semibold dark:bg-spotify-green dark:text-spotify-black dark:hover:bg-spotify-green-hover dark:hover:scale-105 dark:font-bold spotify:bg-spotify-green spotify:text-spotify-black spotify:hover:bg-spotify-green-hover spotify:hover:scale-105 spotify:font-bold spotify:rounded-full",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-spotify-green-light bg-background text-spotify-green-light shadow-xs hover:bg-spotify-green-light hover:text-white dark:border-spotify-green dark:bg-transparent dark:text-spotify-green dark:hover:bg-spotify-green dark:hover:text-spotify-black spotify:border-spotify-green spotify:bg-transparent spotify:text-spotify-green spotify:hover:bg-spotify-green spotify:hover:text-spotify-black",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 dark:bg-spotify-medium-gray dark:text-white dark:hover:bg-spotify-medium-gray/80 spotify:bg-spotify-medium-gray spotify:text-white spotify:hover:bg-spotify-medium-gray/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-spotify-medium-gray dark:hover:text-white spotify:hover:bg-spotify-medium-gray spotify:hover:text-white",
        link: "text-spotify-green-light underline-offset-4 hover:underline dark:text-spotify-green spotify:text-spotify-green",
        spotify: "spotify-gradient text-white font-bold shadow-lg hover:scale-105 rounded-full",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
