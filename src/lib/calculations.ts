import { prisma } from '@/lib/prisma'

export interface FinancialTotals {
  totalSales: number
  totalIncome: number
  totalExpenses: number
  netFlow: number
  pendingIncome: number
  pendingExpenses: number
}

export async function calculateFinancialTotals(
  userId: number,
  organizationId: number,
  startDate: Date,
  endDate: Date,
  type?: string,
  period?: string
): Promise<FinancialTotals> {
  // Buscar vendas do período para Total de Vendas
  const totalSalesResult = await prisma.sale.aggregate({
    where: {
      OR: [
        { organizationId },
        { organizationId: null, userId }
      ],
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
      ...(type === 'EXPENSE' ? { id: -1 } : {}),
    },
    _sum: {
      totalAmount: true,
    },
  })

  // Buscar pagamentos que vencem no período
  const monthlyPayments = await prisma.salePayment.findMany({
    where: {
      sale: { 
        OR: [
          { organizationId },
          { organizationId: null, userId }
        ]
      },
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  })

  // Buscar vendas à vista do período
  const salesCashOnly = await prisma.sale.findMany({
    where: {
      OR: [
        { organizationId },
        { organizationId: null, userId }
      ],
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
      payments: {
        none: {},
      },
      ...(type === 'EXPENSE' ? { id: -1 } : {}),
    },
  })

  // Buscar despesas do período
  const expenses = await prisma.expense.findMany({
    where: {
      OR: [
        { organizationId },
        { organizationId: null, userId }
      ],
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      ...(type === 'INCOME' ? { id: -1 } : {}),
    },
  })

  // Buscar despesas parceladas do período
  const installmentExpenses = await prisma.expense.findMany({
    where: {
      OR: [
        { organizationId },
        { organizationId: null, userId }
      ],
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      installments: {
        gt: 1
      },
      ...(type === 'INCOME' ? { id: -1 } : {}),
    },
  })

  // Buscar despesas fixas do período
  const fixedExpenses = await prisma.expense.findMany({
    where: {
      OR: [
        { organizationId },
        { organizationId: null, userId }
      ],
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      isRecurring: true,
      ...(type === 'INCOME' ? { id: -1 } : {}),
    },
  })

  // Buscar despesas fixas que precisam ser geradas para o período atual
  const recurringExpenses = await prisma.expense.findMany({
    where: {
      OR: [
        { organizationId },
        { organizationId: null, userId }
      ],
      isRecurring: true,
      OR: [
        { recurringEndDate: null },
        { recurringEndDate: { gte: startDate } }
      ],
      ...(type === 'INCOME' ? { id: -1 } : {}),
    },
  })




  // Calcular Total de Vendas
  const totalSales = totalSalesResult._sum.totalAmount || 0


  // Calcular Total de Entradas (vendas à vista + parcelas que vencem no período)
  const totalIncome = [
    // Vendas à vista do período
    ...salesCashOnly.map(sale => sale.totalAmount),
    // Pagamentos que vencem no período (pagos + pendentes)
    ...monthlyPayments.map(payment => payment.amount)
  ].reduce((sum, amount) => sum + amount, 0)


  // Gerar despesas fixas apenas para períodos maiores que "Hoje"
  let generatedExpenses = [...expenses]
  
  // Só gerar despesas recorrentes se não for o filtro "Hoje"
  if (period !== 'today') {
    for (const recurringExpense of recurringExpenses) {
    // Para despesas recorrentes, sempre gerar uma instância para o período atual
    // independente de quando foi criada originalmente
    
    // Calcular a data de vencimento para o período atual
    let dueDate = new Date()
    
    if (recurringExpense.recurringFrequency === 'MONTHLY') {
      // Para despesas mensais, usar o dia do mês original
      if (recurringExpense.recurringDayOfMonth) {
        dueDate.setDate(recurringExpense.recurringDayOfMonth)
      } else {
        // Se não tem dia específico, usar o dia da despesa original
        dueDate.setDate(recurringExpense.dueDate.getDate())
      }
    } else if (recurringExpense.recurringFrequency === 'WEEKLY') {
      // Para despesas semanais, manter o mesmo dia da semana
      const originalDayOfWeek = recurringExpense.dueDate.getDay()
      const daysToAdd = (originalDayOfWeek - dueDate.getDay() + 7) % 7
      dueDate.setDate(dueDate.getDate() + daysToAdd)
    } else if (recurringExpense.recurringFrequency === 'YEARLY') {
      // Para despesas anuais, usar o mesmo dia e mês do ano atual
      dueDate.setMonth(recurringExpense.dueDate.getMonth())
      dueDate.setDate(recurringExpense.dueDate.getDate())
    }
    
    // Verificar se a data calculada está dentro do período
    if (dueDate >= startDate && dueDate <= endDate) {
      // Verificar se já existe uma despesa gerada para este período específico
      const existingGeneratedExpense = generatedExpenses.find(e => 
        e.description === recurringExpense.description &&
        e.amount === recurringExpense.amount &&
        e.dueDate.getTime() === dueDate.getTime() &&
        e.id.toString().startsWith('generated_')
      )
      
      if (!existingGeneratedExpense) {
        const generatedExpense = {
          id: `generated_${recurringExpense.id}_${dueDate.getTime()}`,
          description: recurringExpense.description,
          amount: recurringExpense.amount,
          dueDate: dueDate,
          status: 'PENDING' as const,
          installments: 1,
          isRecurring: false,
          organizationId: recurringExpense.organizationId,
          userId: recurringExpense.userId
        }
        
        generatedExpenses.push(generatedExpense)
      }
    }
  }
  }

  // Calcular Total de Saídas (incluindo despesas geradas)
  const totalExpenses = generatedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  

  // Calcular Saldo Líquido
  const netFlow = totalIncome - totalExpenses

  // Calcular Pendências
  const pendingIncome = monthlyPayments
    .filter(payment => payment.status === 'PENDING')
    .reduce((sum, payment) => sum + payment.amount, 0)

  const pendingExpenses = generatedExpenses
    .filter(expense => expense.status === 'PENDING')
    .reduce((sum, expense) => sum + expense.amount, 0)

  const result = {
    totalSales,
    totalIncome,
    totalExpenses,
    netFlow,
    pendingIncome,
    pendingExpenses,
  }


  return result
}
