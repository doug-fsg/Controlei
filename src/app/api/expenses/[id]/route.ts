import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateExpenseSchema = z.object({
  status: z.enum(['PAID', 'PENDING']).optional(),
  paidAt: z.string().datetime().optional(),
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
    
    // TODO: Pegar userId da sessão
    const userId = 1

    // Verificar se despesa existe e pertence ao usuário
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        userId,
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
          : null,
      },
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
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
    
    // TODO: Pegar userId da sessão
    const userId = 1

    // Verificar se despesa existe e pertence ao usuário
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        userId,
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
    console.error('Erro ao deletar despesa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
