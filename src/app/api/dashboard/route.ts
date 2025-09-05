import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

// GET /api/dashboard - Buscar dados agregados do dashboard
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()

    // Calcular período do mês atual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Buscar dados em paralelo
    const [sales, expenses, clients, recentSales, recentExpenses] = await Promise.all([
      // Vendas do mês atual
      prisma.sale.findMany({
        where: {
          userId,
          saleDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: {
          client: true,
          payments: true,
        },
      }),

      // Despesas do mês atual
      prisma.expense.findMany({
        where: {
          userId,
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: {
          category: true,
        },
      }),

      // Total de clientes
      prisma.client.count({
        where: { userId },
      }),

      // Vendas recentes (últimas 5)
      prisma.sale.findMany({
        where: { userId },
        include: {
          client: true,
          payments: true,
        },
        orderBy: {
          saleDate: 'desc',
        },
        take: 5,
      }),

      // Despesas recentes (últimas 5)
      prisma.expense.findMany({
        where: { userId },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ])

    // Calcular totais de vendas RECEBIDAS no mês atual
    const totalIncome = sales.reduce((sum, sale) => {
      // Se não há pagamentos, é venda à vista (valor total recebido)
      if (!sale.payments || sale.payments.length === 0) {
        return sum + sale.totalAmount
      }
      // Se há pagamentos, somar apenas os pagos
      const paidPayments = sale.payments.filter(p => p.status === 'PAID')
      return sum + paidPayments.reduce((pSum, p) => pSum + p.amount, 0)
    }, 0)
    
    // Manter compatibilidade com código existente
    const totalIncomeReceived = totalIncome
    
    // Calcular pendências apenas de pagamentos que vencem neste mês
    const pendingIncome = await prisma.salePayment.aggregate({
      where: {
        sale: { userId },
        status: 'PENDING',
        dueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    }).then(result => result._sum.amount || 0)

    // Calcular totais de despesas do mês atual
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalExpensesPaid = expenses
      .filter(expense => expense.status === 'PAID')
      .reduce((sum, expense) => sum + expense.amount, 0)
    const pendingExpenses = expenses
      .filter(expense => expense.status === 'PENDING')
      .reduce((sum, expense) => sum + expense.amount, 0)

    // Calcular saldo líquido
    const netBalance = totalIncomeReceived - totalExpensesPaid

    // Contar pagamentos em atraso
    const overduePayments = await prisma.salePayment.count({
      where: {
        sale: { userId },
        status: 'PENDING',
        dueDate: {
          lt: now,
        },
      },
    })

    // Transformar vendas recentes para o formato esperado (remover duplicatas)
    const uniqueRecentSales = recentSales.filter((sale, index, self) => 
      index === self.findIndex(s => s.id === sale.id)
    )
    
    const transformedRecentSales = uniqueRecentSales.map(sale => {
      // Se não há pagamentos, é venda à vista (considerada paga)
      if (!sale.payments || sale.payments.length === 0) {
        return {
          id: sale.id.toString(),
          client: sale.client?.name || 'Cliente não identificado',
          amount: sale.totalAmount,
          date: sale.saleDate.toISOString().split('T')[0],
          status: 'paid' as const,
        }
      }

      // Se há pagamentos, verificar se todos foram pagos
      const totalPaid = sale.payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0)
      const isFullyPaid = totalPaid >= sale.totalAmount

      return {
        id: sale.id.toString(),
        client: sale.client?.name || 'Cliente não identificado',
        amount: sale.totalAmount,
        date: sale.saleDate.toISOString().split('T')[0],
        status: isFullyPaid ? 'paid' : 'pending',
      }
    })

    // Transformar despesas recentes para o formato esperado
    const transformedRecentExpenses = recentExpenses.map(expense => ({
      id: expense.id.toString(),
      supplier: expense.category?.name || 'Categoria não identificada',
      amount: expense.amount,
      date: expense.dueDate.toISOString().split('T')[0],
      status: expense.status === 'PAID' ? 'paid' : 'pending',
    }))

    const dashboardData = {
      totalIncome,
      totalExpenses,
      netBalance,
      pendingIncome,
      pendingExpenses,
      overduePayments,
      totalClients: clients,
      recentSales: transformedRecentSales,
      recentExpenses: transformedRecentExpenses,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autorizado') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
