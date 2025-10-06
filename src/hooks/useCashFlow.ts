import { useQuery } from '@tanstack/react-query'

interface CashFlowFilters {
  dateFrom?: string
  dateTo?: string
  type?: 'INCOME' | 'EXPENSE' | 'ALL'
  status?: 'PENDING' | 'PAID' | 'ALL'
  period?: 'week' | 'month' | 'quarter' | 'year'
  categoryId?: number
}

interface CashFlowItem {
  id: string
  type: 'INCOME' | 'EXPENSE'
  description: string
  amount: number
  dueDate: string
  status: 'PENDING' | 'PAID'
  clientOrSupplier: string
  category: string
  saleId?: number
  paymentId?: number
  runningBalance: number
}

interface CashFlowSummary {
  totalIncome: number
  totalExpenses: number
  totalSales: number
  netFlow: number
  pendingIncome: number
  pendingExpenses: number
  overdueAmount: number
  overdueCount: number
  totalItems: number
  period: {
    startDate: string
    endDate: string
    type: string
  }
}

interface CashFlowData {
  items: CashFlowItem[]
  periodAnalysis: Array<{
    date: string
    income: number
    expenses: number
    netFlow: number
    items: CashFlowItem[]
  }>
  summary: CashFlowSummary
  filters: CashFlowFilters
}

const fetchCashFlow = async (filters: CashFlowFilters): Promise<CashFlowData> => {
  const params = new URLSearchParams()
  
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.type && filters.type !== 'ALL') params.append('type', filters.type)
  if (filters.status && filters.status !== 'ALL') params.append('status', filters.status)
  if (filters.period) params.append('period', filters.period)
  if (filters.categoryId) params.append('categoryId', filters.categoryId.toString())

  const response = await fetch(`/api/reports/cashflow?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error('Erro ao buscar dados do fluxo de caixa')
  }

  return response.json()
}

export function useCashFlow(filters: CashFlowFilters = {}) {
  return useQuery({
    queryKey: ['cashflow', filters],
    queryFn: () => fetchCashFlow(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // 30 segundos
    keepPreviousData: true, // Mantém dados anteriores durante loading
    refetchOnWindowFocus: false, // Evita refetch desnecessário
    retry: 1, // Reduz tentativas de retry
  })
}

export type { CashFlowItem, CashFlowSummary, CashFlowData, CashFlowFilters }

