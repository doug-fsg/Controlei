import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'
import { calculateFinancialTotals } from '@/lib/calculations'

// GET /api/dashboard - Buscar dados agregados do dashboard
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    // Calcular período do mês atual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    

    // Calcular totais financeiros usando função compartilhada
    const financialTotals = await calculateFinancialTotals(
      userId,
      organization.id,
      startOfMonth,
      endOfMonth,
      undefined,
      'month'
    )

    // Buscar dados adicionais em paralelo
    const [clients, recentSales, recentExpenses] = await Promise.all([
      // Total de clientes
      prisma.client.count({
        where: { 
          userId,
          organizationId: organization.id,
        },
      }),

      // Vendas recentes (últimas 5)
      prisma.sale.findMany({
        where: { 
          userId,
          organizationId: organization.id,
        },
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
        where: { 
          userId,
          organizationId: organization.id,
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ])

    // Contar pagamentos em atraso
    const overduePayments = await prisma.salePayment.count({
      where: {
        sale: { 
          userId,
          organizationId: organization.id,
        },
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
      totalSales: financialTotals.totalSales,
      totalIncome: financialTotals.totalIncome,
      totalExpenses: financialTotals.totalExpenses,
      netBalance: financialTotals.netFlow,
      pendingIncome: financialTotals.pendingIncome,
      pendingExpenses: financialTotals.pendingExpenses,
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
