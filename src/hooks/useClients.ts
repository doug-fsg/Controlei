import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '@/lib/api'
import { Client } from '@/types'

// Hook para listar todos os clientes
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
  })
}

// Hook para buscar um cliente específico
export function useClient(id: number) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.getById(id.toString()),
    enabled: !!id,
  })
}

// Hook para criar cliente
export function useCreateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: clientsApi.create,
    onSuccess: (newClient) => {
      // Atualizar cache da lista de clientes
      queryClient.setQueryData(['clients'], (old: Client[] = []) => [newClient, ...old])
    },
  })
}

// Hook para atualizar cliente
export function useUpdateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) =>
      clientsApi.update(id.toString(), data),
    onSuccess: (updatedClient) => {
      // Atualizar cache do cliente específico
      queryClient.setQueryData(['clients', updatedClient.id], updatedClient)
      
      // Atualizar cache da lista de clientes
      queryClient.setQueryData(['clients'], (old: Client[] = []) =>
        old.map(client => client.id === updatedClient.id ? updatedClient : client)
      )
    },
  })
}

// Hook para deletar cliente
export function useDeleteClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => clientsApi.delete(id.toString()),
    onSuccess: (_, deletedId) => {
      // Remover do cache da lista
      queryClient.setQueryData(['clients'], (old: Client[] = []) =>
        old.filter(client => client.id !== deletedId)
      )
      
      // Remover do cache individual
      queryClient.removeQueries({ queryKey: ['clients', deletedId] })
    },
  })
}

// Hook para buscar novos clientes com análises
export function useNewClients() {
  return useQuery({
    queryKey: ['new-clients'],
    queryFn: async () => {
      const response = await fetch('/api/reports/new-clients')
      if (!response.ok) {
        throw new Error('Erro ao buscar dados de novos clientes')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  })
}
