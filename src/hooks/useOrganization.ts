import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

interface Organization {
  id: number
  name: string
  slug: string
  logoUrl?: string | null
}

// Cache para armazenar os dados da organização entre navegações
let organizationCache: Organization | null = null
let isInitialLoad = true

export function useOrganization() {
  const { data: session } = useSession()
  const [organization, setOrganization] = useState<Organization | null>(organizationCache)
  const [loading, setLoading] = useState(isInitialLoad)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }

    // Se já temos os dados em cache, use-os imediatamente
    if (organizationCache) {
      setOrganization(organizationCache)
      setLoading(false)
      return
    }

    const fetchOrganization = async () => {
      try {
        const response = await fetch('/api/organizations/current')
        if (!response.ok) {
          throw new Error('Erro ao buscar organização')
        }
        const org = await response.json()
        
        // Atualiza o estado e o cache
        setOrganization(org)
        organizationCache = org
        isInitialLoad = false
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [session])

  const updateLogo = useCallback((logoUrl: string | null) => {
    // Atualiza tanto o estado quanto o cache
    setOrganization(prevOrg => {
      if (!prevOrg) return prevOrg
      const updatedOrg = { ...prevOrg, logoUrl }
      organizationCache = updatedOrg
      return updatedOrg
    })
  }, [])

  return {
    organization,
    loading,
    error,
    updateLogo
  }
}
