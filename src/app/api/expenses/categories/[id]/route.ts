import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
})

// PUT /api/expenses/categories/[id] - Atualizar categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Validar dados
    const validatedData = updateCategorySchema.parse(body)
    
    // TODO: Pegar userId da sessão
    const userId = 1

    // Verificar se categoria existe e pertence ao usuário
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Se mudou o nome, verificar se não existe outra com mesmo nome
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.expenseCategory.findFirst({
        where: {
          name: validatedData.name,
          userId,
          id: { not: parseInt(id) },
        },
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Categoria com este nome já existe' },
          { status: 400 }
        )
      }
    }

    // Atualizar categoria
    const category = await prisma.expenseCategory.update({
      where: { id: parseInt(id) },
      data: validatedData,
    })

    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/expenses/categories/[id] - Deletar categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    // TODO: Pegar userId da sessão
    const userId = 1

    // Verificar se categoria existe e pertence ao usuário
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se categoria possui despesas
    const expensesCount = await prisma.expense.count({
      where: {
        categoryId: parseInt(id),
      },
    })

    if (expensesCount > 0) {
      return NextResponse.json(
        { error: 'Categoria não pode ser deletada pois possui despesas vinculadas' },
        { status: 400 }
      )
    }

    // Deletar categoria
    await prisma.expenseCategory.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: 'Categoria deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
