import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

// Schema de validação para pagamento de despesa recorrente
const payRecurringExpenseSchema = z.object({
  expenseId: z.number().int().positive(),
  paymentDate: z.string().datetime(),
  amount: z.number().positive(),
  notes: z.string().optional(),
})

// POST /api/expenses/recurring-payments - Marcar pagamento de despesa recorrente
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = payRecurringExpenseSchema.parse(body)

    // Verificar se a despesa existe, é recorrente e pertence à organização
    const expense = await prisma.expense.findFirst({
      where: {
        id: validatedData.expenseId,
        organizationId: organization.id,
        isRecurring: true,
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Despesa recorrente não encontrada' },
        { status: 404 }
      )
    }

    // Normalizar a data para o primeiro dia do mês para evitar duplicatas
    const paymentDate = new Date(validatedData.paymentDate)
    const normalizedDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1)

    // Verificar se já existe pagamento para este mês
    const existingPayment = await prisma.recurringExpensePayment.findUnique({
      where: {
        expenseId_paymentDate: {
          expenseId: validatedData.expenseId,
          paymentDate: normalizedDate,
        },
      },
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Pagamento já registrado para este mês' },
        { status: 409 }
      )
    }

    // Criar registro de pagamento
    const payment = await prisma.recurringExpensePayment.create({
      data: {
        expenseId: validatedData.expenseId,
        paymentDate: normalizedDate,
        amount: validatedData.amount,
        notes: validatedData.notes,
        userId,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao registrar pagamento recorrente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET /api/expenses/recurring-payments - Listar pagamentos de despesas recorrentes
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

    const payments = await prisma.recurringExpensePayment.findMany({
      where: {
        expense: {
          organizationId: organization.id,
        },
      },
      include: {
        expense: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.error('Erro ao buscar pagamentos recorrentes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
