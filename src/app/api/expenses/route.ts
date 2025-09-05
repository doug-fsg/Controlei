import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação para criação de despesa
const createExpenseSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  dueDate: z.string().datetime(),
  categoryId: z.number().int().positive('Categoria é obrigatória'),
  notes: z.string().optional(),
  
  // Para despesas parceladas
  installments: z.object({
    numberOfInstallments: z.number().int().min(2),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
  }).optional(),
  
  // Para despesas recorrentes
  recurring: z.object({
    frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
})

// GET /api/expenses - Listar despesas
export async function GET(request: NextRequest) {
  try {
    // TODO: Pegar userId da sessão
    const userId = 1

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
      },
      include: {
        category: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    })

    // Transformar dados para o formato esperado pelo frontend
    const transformedExpenses = expenses.map(expense => ({
      ...expense,
      categories: expense.category ? [expense.category.id.toString()] : [], // Converter para array de strings, com fallback
      paidAmount: expense.status === 'PAID' ? expense.amount : 0, // Se pago, usar o valor total
      paidDate: expense.paidAt, // Usar o valor real do banco
    }));

    return NextResponse.json(transformedExpenses)
  } catch (error) {
    console.error('Erro ao buscar despesas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/expenses - Criar despesa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validatedData = createExpenseSchema.parse(body)
    
    // TODO: Pegar userId da sessão
    const userId = 1

    // Verificar se categoria existe e pertence ao usuário
    const categoryId = validatedData.categoryId;
    const category = await prisma.expenseCategory.findFirst({
      where: {
        id: categoryId,
        userId,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Determinar tipo de despesa e criar accordingly
      if (validatedData.installments) {
        // Despesa Parcelada
        const { numberOfInstallments, dayOfMonth } = validatedData.installments
        const installmentAmount = validatedData.amount / numberOfInstallments
        const expenses = []

        for (let i = 0; i < numberOfInstallments; i++) {
          const dueDate = new Date(validatedData.dueDate)
          
          if (dayOfMonth) {
            // Usar dia específico do mês
            dueDate.setMonth(dueDate.getMonth() + i)
            dueDate.setDate(dayOfMonth)
          } else {
            // Usar o mesmo dia da primeira parcela
            dueDate.setMonth(dueDate.getMonth() + i)
          }

          const expense = await tx.expense.create({
            data: {
              description: `${validatedData.description} (${i + 1}/${numberOfInstallments})`,
              amount: installmentAmount,
              dueDate,
              categoryId: categoryId,
              notes: validatedData.notes,
              userId,
              installmentNumber: i + 1,
              totalInstallments: numberOfInstallments,
            },
          })
          expenses.push(expense)
        }

        return expenses
      } else if (validatedData.recurring) {
        // Despesa Recorrente
        const { frequency, dayOfMonth, endDate } = validatedData.recurring
        
        const expense = await tx.expense.create({
          data: {
            description: validatedData.description,
            amount: validatedData.amount,
            dueDate: new Date(validatedData.dueDate),
            categoryId: categoryId,
            notes: validatedData.notes,
            userId,
            isRecurring: true,
            recurringFrequency: frequency,
            recurringDayOfMonth: dayOfMonth,
            recurringEndDate: endDate ? new Date(endDate) : null,
          },
        })

        return [expense]
      } else {
        // Despesa Única
        const expense = await tx.expense.create({
          data: {
            description: validatedData.description,
            amount: validatedData.amount,
            dueDate: new Date(validatedData.dueDate),
            categoryId: categoryId,
            notes: validatedData.notes,
            userId,
          },
        })

        return [expense]
      }
    })

    // Buscar despesas com categoria
    const expensesWithCategory = await prisma.expense.findMany({
      where: {
        id: {
          in: result.map(e => e.id),
        },
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(expensesWithCategory, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar despesa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
