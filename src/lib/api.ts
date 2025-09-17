import { Client, CreateClientData, ExpenseCategory, CreateExpenseCategoryData, Sale, CreateSaleData, Expense, CreateExpenseData, SalePayment } from '@/types'

// Configurações da API
const API_BASE_URL = '/api'

// Função utilitária para chamadas à API
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// API de Clientes
export const clientsApi = {
  getAll: () => apiCall<Client[]>('/clients'),
  
  getById: (id: string) => apiCall<Client>(`/clients/${id}`),
  
  create: (data: {
    name: string
    email?: string
    phone?: string
    document?: string
    address?: string
    notes?: string
  }) => apiCall<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: Partial<{
    name: string
    email?: string
    phone?: string
    document?: string
    address?: string
    notes?: string
  }>) => apiCall<Client>(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiCall<{ message: string }>(`/clients/${id}`, {
    method: 'DELETE',
  }),
}

// API de Categorias
export const categoriesApi = {
  getAll: () => apiCall<ExpenseCategory[]>('/expenses/categories'),
  
  create: (data: {
    name: string
    description?: string
    color?: string
  }) => apiCall<ExpenseCategory>('/expenses/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: Partial<{
    name: string
    description?: string
    color?: string
  }>) => apiCall<ExpenseCategory>(`/expenses/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiCall<{ message: string }>(`/expenses/categories/${id}`, {
    method: 'DELETE',
  }),
}

// API de Vendas
export const salesApi = {
  getAll: () => apiCall<Sale[]>('/sales'),
  
  getById: (id: string) => apiCall<Sale>(`/sales/${id}`),
  
  create: (data: {
    clientId: number
    totalAmount: number
    saleDate: string
    notes?: string
    advances?: Array<{
      amount: number
      dueDate: string
    }>
    installments?: {
      remainingAmount: number
      numberOfInstallments: number
      startDate: string
    }
  }) => apiCall<Sale>('/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: {
    clientId?: number
    totalAmount?: number
    saleDate?: string
    notes?: string
  }) => apiCall<Sale>(`/sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => apiCall<{ message: string }>(`/sales/${id}`, {
    method: 'DELETE',
  }),
  
  markPaymentAsPaid: (paymentId: number) => apiCall<SalePayment>(`/sales/payments/${paymentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'PAID',
      paidDate: new Date().toISOString(),
    }),
  }),
  
  markPaymentAsPending: (paymentId: number) => apiCall<SalePayment>(`/sales/payments/${paymentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'PENDING',
    }),
  }),
  
  markExpenseAsPaid: (expenseId: number) => apiCall<Expense>(`/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'PAID',
      paidAt: new Date().toISOString(),
    }),
  }),
  
  markExpenseAsPending: (expenseId: number) => apiCall<Expense>(`/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'PENDING',
    }),
  }),
  
  editExpense: (expenseId: number, data: {
    description: string
    amount: number
    dueDate: string
    categoryId: number
    notes?: string
  }) => apiCall<Expense>(`/expenses/${expenseId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteExpense: (expenseId: number) => apiCall<{ message: string }>(`/expenses/${expenseId}`, {
    method: 'DELETE',
  }),
}

// API de Despesas
export const expensesApi = {
  getAll: () => apiCall<Expense[]>('/expenses'),
  
  create: (data: {
    description: string
    amount: number
    dueDate: string
    categoryId: number
    notes?: string
    installments?: {
      numberOfInstallments: number
      dayOfMonth?: number
    }
    recurring?: {
      frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
      dayOfMonth?: number
      endDate?: string
    }
  }) => apiCall<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Pagamentos de despesas recorrentes
  payRecurring: (data: {
    expenseId: number
    paymentDate: string
    amount: number
    notes?: string
  }) => apiCall<any>('/expenses/recurring-payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getRecurringPayments: () => apiCall<any[]>('/expenses/recurring-payments'),
}

// API do Dashboard
export const dashboardApi = {
  getStats: () => apiCall<{
    totalIncome: number
    totalExpenses: number
    netBalance: number
    pendingIncome: number
    pendingExpenses: number
    overduePayments: number
    totalClients: number
    recentSales: Array<{
      id: string
      client: string
      amount: number
      date: string
      status: 'paid' | 'pending'
    }>
    recentExpenses: Array<{
      id: string
      supplier: string
      amount: number
      date: string
      status: 'paid' | 'pending'
    }>
  }>('/dashboard'),
}
