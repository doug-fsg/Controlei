import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/lib/api'
import { ExpenseCategory } from '@/types'

// Hook para listar todas as categorias
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
    select: (data) => data || [], // Garantir que sempre retorna um array
  })
}

// Hook para criar categoria
export function useCreateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: (newCategory) => {
      // Atualizar cache da lista de categorias
      queryClient.setQueryData(['categories'], (old: ExpenseCategory[] = []) => [newCategory, ...old])
    },
  })
}

// Hook para atualizar categoria
export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ExpenseCategory> }) =>
      categoriesApi.update(id.toString(), data),
    onSuccess: (updatedCategory) => {
      // Atualizar cache da lista de categorias
      queryClient.setQueryData(['categories'], (old: ExpenseCategory[] = []) =>
        old.map(category => category.id === updatedCategory.id ? updatedCategory : category)
      )
    },
  })
}

// Hook para deletar categoria
export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id.toString()),
    onSuccess: (_, deletedId) => {
      // Remover do cache da lista
      queryClient.setQueryData(['categories'], (old: ExpenseCategory[] = []) =>
        old.filter(category => category.id !== deletedId)
      )
    },
  })
}
