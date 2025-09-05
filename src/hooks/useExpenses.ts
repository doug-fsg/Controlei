import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesApi, salesApi } from '@/lib/api'
import { Expense, CreateExpenseData } from '@/types'

// Hook para buscar todas as despesas
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: expensesApi.getAll,
    select: (data) => data || [], // Garantir que sempre retorna um array
  })
}

// Hook para criar despesa
export function useCreateExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: expensesApi.create,
    onSuccess: (newExpense) => {
      // Atualizar cache da lista de despesas
      queryClient.setQueryData(['expenses'], (old: Expense[] = []) => [...old, newExpense])
    },
  })
}

// Hook para marcar despesa como paga
export function useMarkExpenseAsPaid() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: salesApi.markExpenseAsPaid,
    onSuccess: () => {
      // Invalidar cache das despesas para recarregar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

// Hook para deletar despesa
export function useDeleteExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: salesApi.deleteExpense,
    onSuccess: () => {
      // Invalidar cache das despesas para recarregar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

// Hook para pagar despesa recorrente
export function usePayRecurringExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: expensesApi.payRecurring,
    onSuccess: () => {
      // Invalidar cache para recarregar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['recurring-payments'] })
    },
  })
}

// Hook para buscar pagamentos recorrentes
export function useRecurringPayments() {
  return useQuery({
    queryKey: ['recurring-payments'],
    queryFn: expensesApi.getRecurringPayments,
    select: (data) => data || [],
  })
}
