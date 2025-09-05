"use client";

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Ainda carregando

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Se autenticado, redireciona para dashboard
    router.push('/dashboard')
  }, [session, status, router])

  return (
    <div className={cn(
      "flex min-h-screen items-center justify-center",
      "bg-background", // Light mode
      "dark:bg-gradient-to-br dark:from-spotify-black dark:to-spotify-dark-gray", // Dark mode
      "spotify:bg-gradient-to-br spotify:from-spotify-black spotify:to-spotify-dark-gray" // Spotify mode
    )}>
      <div className="text-center">
        <h1 className={cn(
          "text-4xl font-bold mb-4",
          "spotify-text-gradient", // Aplica o gradiente em todos os modos
          "dark:text-white", // Dark mode
          "spotify:text-white" // Spotify mode
        )}>
          Sistema Financeiro
        </h1>
        <p className={cn(
          "text-lg",
          "text-muted-foreground", // Light mode
          "dark:text-spotify-light-gray", // Dark mode
          "spotify:text-spotify-light-gray" // Spotify mode
        )}>
          {status === 'loading' ? 'Carregando...' : 'Redirecionando...'}
        </p>
        {status === 'loading' && (
          <div className="mt-6">
            <div className={cn(
              "animate-spin rounded-full h-8 w-8 border-b-2 mx-auto",
              "border-spotify-green-light", // Light mode - verde escuro
              "dark:border-spotify-green", // Dark mode
              "spotify:border-spotify-green" // Spotify mode
            )}></div>
          </div>
        )}
      </div>
    </div>
  );
}
