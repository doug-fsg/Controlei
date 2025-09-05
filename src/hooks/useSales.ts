import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/lib/api'
import { Sale, CreateSaleData } from '@/types'

// Hook para buscar todas as vendas
export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: salesApi.getAll,
  })
}

// Hook para criar venda
export function useCreateSale() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: salesApi.create,
    onSuccess: (newSale) => {
      // Atualizar cache da lista de vendas
      queryClient.setQueryData(['sales'], (old: Sale[] = []) => [...old, newSale])
    },
  })
}

// Hook para marcar pagamento como pago
export function useMarkPaymentAsPaid() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: salesApi.markPaymentAsPaid,
    onSuccess: () => {
      // Invalidar cache das vendas para recarregar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

// Hook para marcar pagamento como pendente (desfazer pagamento)
export function useMarkPaymentAsPending() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: salesApi.markPaymentAsPending,
    onSuccess: () => {
      // Invalidar cache das vendas para recarregar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

// Hook para buscar venda específica
export function useSale(id: string) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => salesApi.getById(id),
    enabled: !!id,
  })
}

// Hook para atualizar venda
export function useUpdateSale() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      salesApi.update(id, data),
    onSuccess: (updatedSale) => {
      // Atualizar cache da venda específica
      queryClient.setQueryData(['sales', updatedSale.id.toString()], updatedSale)
      
      // Invalidar cache da lista de vendas
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      
      // Invalidar cache do dashboard
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Hook para excluir venda
export function useDeleteSale() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => salesApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidar cache da lista de vendas
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      
      // Invalidar cache do dashboard
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      // Remover do cache individual
      queryClient.removeQueries({ queryKey: ['sales', deletedId] })
    },
  })
}
