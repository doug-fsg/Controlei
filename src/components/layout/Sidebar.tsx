"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  Home, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo, LogoIcon } from "@/components/ui/Logo";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Vendas", href: "/sales", icon: ShoppingCart },
  { name: "Despesas", href: "/expenses", icon: CreditCard },
  { name: "Relatórios", href: "/reports", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    // Inicializar com o valor do localStorage ou false por padrão
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Persistir o estado no localStorage sempre que mudar
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Fallback: redirecionar manualmente
      router.push('/auth/signin');
    }
  };

  return (
    <div 
      className={cn(
        "flex h-full flex-col border-r transition-all duration-300",
        "bg-background dark:spotify-sidebar spotify:spotify-sidebar",
        "border-border dark:border-spotify-medium-gray spotify:border-spotify-medium-gray",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn(
        "flex h-16 items-center border-b px-4",
        "border-border dark:border-spotify-medium-gray spotify:border-spotify-medium-gray",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <Logo size="md" showText={false} />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "h-8 w-8",
            "text-spotify-dark-text hover:text-spotify-green-light hover:bg-spotify-green-light/10", // Light mode - cores escuras
            "dark:text-spotify-light-gray dark:hover:text-spotify-green dark:hover:bg-spotify-medium-gray",
            "spotify:text-spotify-light-gray spotify:hover:text-spotify-green spotify:hover:bg-spotify-medium-gray"
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className={cn(
        "px-4 py-2",
        isCollapsed && "hidden"
      )}>
        <OrganizationSwitcher />
      </div>
      
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? cn(
                      "bg-spotify-green-light/15 text-spotify-green-light shadow-sm font-semibold", // Light mode - verde escuro
                      "dark:bg-spotify-green dark:text-spotify-black dark:shadow-lg", // Dark mode
                      "spotify:bg-spotify-green spotify:text-spotify-black spotify:shadow-lg" // Spotify mode
                    )
                  : cn(
                      "text-spotify-dark-text hover:bg-spotify-green-light/10 hover:text-spotify-green-light", // Light mode - texto e hover escuros
                      "dark:text-spotify-light-gray dark:hover:text-white dark:hover:bg-spotify-medium-gray", // Dark mode
                      "spotify:text-spotify-light-gray spotify:hover:text-white spotify:hover:bg-spotify-medium-gray" // Spotify mode
                    ),
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn(
        "border-t p-4",
        "border-border dark:border-spotify-medium-gray spotify:border-spotify-medium-gray",
        isCollapsed ? "flex justify-center" : "flex justify-start"
      )}>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "justify-start space-x-3 transition-all duration-200",
            "text-red-600 hover:text-red-700 hover:bg-red-50", // Light mode
            "dark:text-spotify-light-gray dark:hover:text-white dark:hover:bg-spotify-medium-gray", // Dark mode
            "spotify:text-spotify-light-gray spotify:hover:text-white spotify:hover:bg-spotify-medium-gray", // Spotify mode
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </div>
  );
}