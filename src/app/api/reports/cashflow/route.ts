import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

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

    const { searchParams } = new URL(request.url)
    
    // Parâmetros de filtro
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const type = searchParams.get('type') // 'INCOME', 'EXPENSE', 'ALL'
    const status = searchParams.get('status') // 'PENDING', 'PAID', 'ALL'
    const period = searchParams.get('period') || 'month' // 'week', 'month', 'quarter', 'year'
    const categoryId = searchParams.get('categoryId') // ID da categoria para filtrar despesas

    // Calcular datas baseado no período
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 dias para futuro
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        endDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    // Usar datas personalizadas se fornecidas
    if (dateFrom) startDate = new Date(dateFrom)
    if (dateTo) endDate = new Date(dateTo)

    // Buscar pagamentos (entradas) que foram efetivados no período
    const payments = await prisma.salePayment.findMany({
      where: {
        sale: { 
          userId,
          organizationId: organization.id,
        },
        OR: [
          // Pagamentos que vencem no período (pendentes ou pagos)
          {
            dueDate: {
              gte: startDate,
              lte: endDate,
            },
            ...(status === 'PAID' ? { status: 'PAID' } : {}),
            ...(status === 'PENDING' ? { status: 'PENDING' } : {}),
          },
          // Pagamentos que foram efetivados no período (independente do vencimento)
          ...(status !== 'PENDING' ? [{
            status: 'PAID',
            paidDate: {
              gte: startDate,
              lte: endDate,
            },
          }] : []),
        ],
        ...(type === 'EXPENSE' ? { id: -1 } : {}), // Excluir se só quiser despesas
      },
      include: {
        sale: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    // Buscar vendas à vista do período
    const salesCashOnly = await prisma.sale.findMany({
      where: {
        userId,
        organizationId: organization.id,
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        payments: {
          none: {}, // Vendas sem pagamentos (à vista)
        },
        ...(type === 'EXPENSE' ? { id: -1 } : {}), // Excluir se só quiser despesas
      },
      include: {
        client: true,
      },
    })

    // Buscar despesas (saídas)
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        organizationId: organization.id,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(type === 'INCOME' ? { id: -1 } : {}), // Excluir se só quiser entradas
        ...(categoryId ? { categoryId: parseInt(categoryId) } : {}), // Filtrar por categoria se especificado
      },
      include: {
        category: true,
      },
    })

    // Transformar pagamentos e vendas à vista em itens de fluxo de caixa
    const incomeItems = [
      // Vendas à vista
      ...salesCashOnly.map(sale => ({
        id: `sale_${sale.id}`,
        type: 'INCOME' as const,
        description: `Venda - ${sale.client?.name || 'Cliente'}`,
        amount: sale.totalAmount,
        dueDate: sale.saleDate,
        status: 'PAID' as const,
        clientOrSupplier: sale.client?.name || 'Cliente',
        category: 'Vendas',
        saleId: sale.id,
        paymentId: null,
      })),
      // Pagamentos parcelados
      ...payments.map(payment => ({
        id: `payment_${payment.id}`,
        type: 'INCOME' as const,
        description: `Venda - ${payment.sale?.client?.name || 'Cliente'}${payment.installmentNumber ? ` (Parcela ${payment.installmentNumber}/${payment.totalInstallments})` : ''}`,
        amount: payment.amount,
        // Usar data de pagamento se foi pago, senão usar data de vencimento
        dueDate: payment.status === 'PAID' && payment.paidDate ? payment.paidDate : payment.dueDate,
        status: payment.status as 'PAID' | 'PENDING',
        clientOrSupplier: payment.sale?.client?.name || 'Cliente',
        category: 'Vendas',
        saleId: payment.sale?.id || null,
        paymentId: payment.id,
      }))
    ]

    // Transformar despesas em itens de fluxo de caixa
    const expenseItems = expenses.map(expense => ({
      id: `expense_${expense.id}`,
      type: 'EXPENSE' as const,
      description: `${expense.description}${expense.category ? ` - ${expense.category.name}` : ''}`,
      amount: expense.amount,
      dueDate: expense.dueDate,
      status: expense.status as 'PAID' | 'PENDING',
      clientOrSupplier: expense.supplier || 'Fornecedor',
      category: expense.category?.name || 'Despesas',
      saleId: null,
      paymentId: null,
    }))

    // Combinar e ordenar todos os itens
    const allItems = [...incomeItems, ...expenseItems].sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )

    // Calcular totais
    const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0)
    const netFlow = totalIncome - totalExpenses

    // Calcular saldo acumulado
    let runningBalance = 0
    const itemsWithBalance = allItems.map(item => {
      if (item.type === 'INCOME') {
        runningBalance += item.amount
      } else {
        runningBalance -= item.amount
      }
      return { ...item, runningBalance }
    })

    // Agrupar por período para análise temporal
    const groupedByPeriod = itemsWithBalance.reduce((acc, item) => {
      const dateKey = new Date(item.dueDate).toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          income: 0,
          expenses: 0,
          netFlow: 0,
          items: [],
        }
      }
      
      if (item.type === 'INCOME') {
        acc[dateKey].income += item.amount
        acc[dateKey].netFlow += item.amount
      } else {
        acc[dateKey].expenses += item.amount
        acc[dateKey].netFlow -= item.amount
      }
      
      acc[dateKey].items.push(item)
      return acc
    }, {} as Record<string, any>)

    // Converter para array e ordenar
    const periodAnalysis = Object.values(groupedByPeriod).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calcular métricas adicionais
    const pendingIncome = incomeItems
      .filter(item => item.status === 'PENDING')
      .reduce((sum, item) => sum + item.amount, 0)

    const pendingExpenses = expenseItems
      .filter(item => item.status === 'PENDING')
      .reduce((sum, item) => sum + item.amount, 0)

    const overdueItems = itemsWithBalance.filter(item => 
      item.status === 'PENDING' && new Date(item.dueDate) < new Date()
    )

    const overdueAmount = overdueItems.reduce((sum, item) => sum + item.amount, 0)

    // Projeção de 12 meses para o gráfico de linha
    const projectionMonths = []
    const currentDate = new Date()
    
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 0)
      
      // Buscar parcelas de vendas para este mês
      const monthSales = await prisma.sale.findMany({
        where: {
          userId,
          organizationId: organization.id,
        },
        include: {
          payments: {
            where: {
              dueDate: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          },
        },
      })

      // Buscar despesas para este mês (incluindo recorrentes)
      const monthExpenses = await prisma.expense.findMany({
        where: {
          userId,
          organizationId: organization.id,
          dueDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })

      const monthIncome = monthSales.reduce((sum, sale) => {
        return sum + sale.payments.reduce((paySum, payment) => paySum + payment.amount, 0)
      }, 0)

      const monthExpensesTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

      projectionMonths.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        monthKey: monthStart.toISOString().slice(0, 7), // YYYY-MM
        income: monthIncome,
        expenses: monthExpensesTotal,
        balance: monthIncome - monthExpensesTotal,
        date: monthStart.toISOString(),
      })
    }

    return NextResponse.json({
      items: itemsWithBalance,
      periodAnalysis,
      monthlyProjection: projectionMonths,
      summary: {
        totalIncome,
        totalExpenses,
        netFlow,
        pendingIncome,
        pendingExpenses,
        overdueAmount,
        overdueCount: overdueItems.length,
        totalItems: itemsWithBalance.length,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: period,
        },
      },
      filters: {
        type,
        status,
        dateFrom: dateFrom || startDate.toISOString(),
        dateTo: dateTo || endDate.toISOString(),
        period,
      },
    })

  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('Erro ao gerar relatório de fluxo de caixa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

