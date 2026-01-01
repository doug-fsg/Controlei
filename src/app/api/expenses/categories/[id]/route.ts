import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

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
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const { id } = params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'ID da categoria inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    // Verificar se categoria existe e pertence à organização
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        id: categoryId,
        organizationId: organization.id,
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
          organizationId: organization.id,
          id: { not: categoryId },
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
      where: { id: categoryId },
      data: validatedData,
    })

    return NextResponse.json(category)
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
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const { id } = params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'ID da categoria inválido' },
        { status: 400 }
      )
    }

    // Verificar se categoria existe e pertence à organização
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        id: categoryId,
        organizationId: organization.id,
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
        categoryId: categoryId,
        organizationId: organization.id,
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
      where: { id: categoryId },
    })

    return NextResponse.json({ message: 'Categoria deletada com sucesso' })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.error('Erro ao deletar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
