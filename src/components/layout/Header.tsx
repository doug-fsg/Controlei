"use client";

import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      })
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Fallback: redirecionar manualmente
      router.push('/auth/signin')
    }
  }

  return (
    <header className={cn(
      "flex h-16 items-center justify-between border-b px-6",
      "bg-background border-border", // Light mode
      "dark:bg-spotify-dark-gray dark:border-spotify-medium-gray", // Dark mode
      "spotify:bg-spotify-dark-gray spotify:border-spotify-medium-gray" // Spotify mode
    )}>
      <div className="flex items-center space-x-4">
        <h2 className={cn(
          "text-lg font-semibold",
          "text-foreground", // Light mode
          "dark:text-white", // Dark mode
          "spotify:text-white" // Spotify mode
        )}>
          Bem-vindo, {session?.user?.name || session?.user?.email || 'Usuário'}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            "transition-all duration-200",
            "text-spotify-dark-text hover:text-spotify-green-light hover:bg-spotify-green-light/10", // Light mode - cores escuras
            "dark:text-spotify-light-gray dark:hover:text-white dark:hover:bg-spotify-medium-gray", // Dark mode
            "spotify:text-spotify-light-gray spotify:hover:text-white spotify:hover:bg-spotify-medium-gray" // Spotify mode
          )}
        >
          <Bell className="h-5 w-5" />
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className={cn(
                "transition-all duration-200",
                "text-spotify-dark-text hover:text-spotify-green-light hover:bg-spotify-green-light/10", // Light mode - cores escuras
                "dark:text-spotify-light-gray dark:hover:text-white dark:hover:bg-spotify-medium-gray", // Dark mode
                "spotify:text-spotify-light-gray spotify:hover:text-white spotify:hover:bg-spotify-medium-gray" // Spotify mode
              )}
            >
              <User className="h-5 w-5" />
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
            <DropdownMenuLabel className={cn(
              "text-foreground", // Light mode
              "dark:text-white", // Dark mode
              "spotify:text-white" // Spotify mode
            )}>
              Minha Conta
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={cn(
              "bg-border", // Light mode
              "dark:bg-spotify-medium-gray", // Dark mode
              "spotify:bg-spotify-medium-gray" // Spotify mode
            )} />
            <DropdownMenuItem className={cn(
              "text-spotify-dark-text hover:bg-spotify-green-light/10 hover:text-spotify-green-light", // Light mode - cores escuras
              "dark:text-spotify-light-gray dark:hover:text-white dark:hover:bg-spotify-green/20", // Dark mode
              "spotify:text-spotify-light-gray spotify:hover:text-white spotify:hover:bg-spotify-green/20" // Spotify mode
            )}>
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className={cn(
              "text-spotify-dark-text hover:bg-spotify-green-light/10 hover:text-spotify-green-light", // Light mode - cores escuras
              "dark:text-spotify-light-gray dark:hover:text-white dark:hover:bg-spotify-green/20", // Dark mode
              "spotify:text-spotify-light-gray spotify:hover:text-white spotify:hover:bg-spotify-green/20" // Spotify mode
            )}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(
              "bg-border", // Light mode
              "dark:bg-spotify-medium-gray", // Dark mode
              "spotify:bg-spotify-medium-gray" // Spotify mode
            )} />
            <DropdownMenuItem 
              onClick={handleLogout}
              className={cn(
                "text-red-600 hover:text-red-700 hover:bg-red-50", // Light mode
                "dark:text-spotify-light-gray dark:hover:text-white dark:hover:bg-red-600/20 dark:focus:text-white dark:focus:bg-red-600/20", // Dark mode
                "spotify:text-spotify-light-gray spotify:hover:text-white spotify:hover:bg-red-600/20 spotify:focus:text-white spotify:focus:bg-red-600/20" // Spotify mode
              )}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}