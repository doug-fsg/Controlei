'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'
import { useOrganization } from '@/hooks/useOrganization'

interface Organization {
  id: number
  name: string
  slug: string
  role: string
  logoUrl?: string | null
}

export function OrganizationSwitcher() {
  const [open, setOpen] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const { organization: currentOrg, updateLogo } = useOrganization()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations/list')
        if (!response.ok) {
          throw new Error('Erro ao buscar organizações')
        }
        const data = await response.json()
        setOrganizations(data)
      } catch (error) {
        console.error('Erro ao buscar organizações:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar suas organizações',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [toast])

  const handleSwitchOrg = async (orgId: number) => {
    try {
      const response = await fetch('/api/organizations/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId: orgId }),
      })

      if (!response.ok) {
        throw new Error('Erro ao alternar organização')
      }

      // Recarregar a página para atualizar os dados
      router.refresh()
      
      // Fechar o popover
      setOpen(false)
      
      toast({
        title: 'Organização alterada',
        description: 'Os dados foram atualizados com sucesso',
      })
    } catch (error) {
      console.error('Erro ao alternar organização:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível alternar para a organização selecionada',
        variant: 'destructive',
      })
    }
  }

  if (loading || !currentOrg) {
    return (
      <Button variant="outline" className="w-full justify-start opacity-70">
        <Building2 className="mr-2 h-4 w-4" />
        <span className="truncate">Carregando...</span>
      </Button>
    )
  }

  // Se o usuário só tem uma organização, não mostrar o seletor
  if (organizations.length <= 1) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecione uma organização"
          className="w-full justify-between"
        >
          <div className="flex items-center truncate">
            <Building2 className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{currentOrg.name}</span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar organização..." />
          <CommandList>
            <CommandEmpty>Nenhuma organização encontrada.</CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => {
                    if (org.id !== currentOrg.id) {
                      handleSwitchOrg(org.id)
                    } else {
                      setOpen(false)
                    }
                  }}
                  className="text-sm"
                >
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{org.name}</span>
                  </div>
                  {org.id === currentOrg.id && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
