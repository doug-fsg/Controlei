import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface Organization {
  id: number
  name: string
  slug: string
  logoUrl?: string | null
}

export function useOrganization() {
  const { data: session } = useSession()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
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
        setOrganization(org)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [session])

  const updateLogo = useCallback((logoUrl: string | null) => {
    setOrganization(prevOrg => prevOrg ? { ...prevOrg, logoUrl } : prevOrg)
  }, [])

  return {
    organization,
    loading,
    error,
    updateLogo
  }
}
