'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Ainda carregando
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Ainda carregando
  if (status === 'loading') {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-spotify-green mx-auto mb-3"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  // Não autenticado
  if (!session) {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  // Autenticado - renderiza o conteúdo
  return <>{children}</>
}
