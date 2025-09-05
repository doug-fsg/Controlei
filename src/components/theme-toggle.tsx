"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className={cn(
          "bg-popover border-border", // Light mode
          "dark:bg-spotify-medium-gray dark:border-spotify-medium-gray", // Dark mode
          "spotify:bg-spotify-medium-gray spotify:border-spotify-medium-gray" // Spotify mode
        )}
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={cn(
            "cursor-pointer",
            theme === "light" && "bg-spotify-green-light/15 text-spotify-green-light",
            "text-spotify-dark-text hover:bg-spotify-green-light/10 hover:text-spotify-green-light", // Light mode - cores escuras
            "dark:text-spotify-light-gray dark:hover:text-white dark:hover:bg-spotify-green/20",
            "spotify:text-spotify-light-gray spotify:hover:text-white spotify:hover:bg-spotify-green/20"
          )}
        >
          <Sun className="mr-2 h-4 w-4" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={cn(
            "cursor-pointer",
            theme === "dark" && "bg-spotify-green/20 text-spotify-green",
            "text-spotify-dark-text hover:bg-spotify-green-light/10 hover:text-spotify-green-light", // Light mode - cores escuras
            "dark:text-spotify-light-gray dark:hover:text-white dark:hover:bg-spotify-green/20",
            "spotify:text-spotify-light-gray spotify:hover:text-white spotify:hover:bg-spotify-green/20"
          )}
        >
          <Moon className="mr-2 h-4 w-4" />
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className={cn(
            "cursor-pointer",
            theme === "system" && "bg-primary/20 text-primary"
          )}
        >
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
