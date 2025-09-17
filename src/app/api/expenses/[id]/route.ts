import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

const updateExpenseSchema = z.object({
  status: z.enum(['PAID', 'PENDING']).optional(),
  paidAt: z.string().datetime().optional(),
})

const editExpenseSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  dueDate: z.string().datetime(),
  categoryId: z.number().int().positive('Categoria é obrigatória'),
  notes: z.string().optional(),
})

// PATCH /api/expenses/[id] - Marcar despesa como paga/pendente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const expenseId = parseInt(id, 10)
    
    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: 'ID da despesa inválido' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    // Validar dados
    const validatedData = updateExpenseSchema.parse(body)
    
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    // Verificar se despesa existe e pertence à organização do usuário
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        organizationId: organization.id,
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Despesa não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar despesa
    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        status: validatedData.status || expense.status,
        paidAt: validatedData.status === 'PAID' 
          ? (validatedData.paidAt ? new Date(validatedData.paidAt) : new Date())
          : validatedData.status === 'PENDING'
          ? null
          : expense.paidAt,
      },
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.error('Erro ao atualizar despesa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/expenses/[id] - Deletar despesa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const expenseId = parseInt(id, 10)
    
    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: 'ID da despesa inválido' },
        { status: 400 }
      )
    }
    
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    // Verificar se despesa existe e pertence à organização do usuário
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        organizationId: organization.id,
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Despesa não encontrada' },
        { status: 404 }
      )
    }

    // Deletar despesa
    await prisma.expense.delete({
      where: { id: expenseId },
    })

    return NextResponse.json({ message: 'Despesa deletada com sucesso' })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.error('Erro ao deletar despesa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/expenses/[id] - Editar despesa (apenas despesas únicas)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const expenseId = parseInt(id, 10)
    
    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: 'ID da despesa inválido' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    // Validar dados
    const validatedData = editExpenseSchema.parse(body)
    
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    // Verificar se despesa existe e pertence à organização do usuário
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        organizationId: organization.id,
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Despesa não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se é uma despesa única (não parcelada nem recorrente)
    if (expense.isRecurring || expense.totalInstallments) {
      return NextResponse.json(
        { error: 'Apenas despesas únicas podem ser editadas. Para despesas parceladas ou recorrentes, crie uma nova despesa e exclua a anterior.' },
        { status: 400 }
      )
    }

    // Verificar se categoria existe e pertence à organização
    const category = await prisma.expenseCategory.findFirst({
      where: {
        id: validatedData.categoryId,
        organizationId: organization.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar despesa
    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        description: validatedData.description,
        amount: validatedData.amount,
        dueDate: new Date(validatedData.dueDate),
        categoryId: validatedData.categoryId,
        notes: validatedData.notes,
        updatedAt: new Date(),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.error('Erro ao editar despesa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
