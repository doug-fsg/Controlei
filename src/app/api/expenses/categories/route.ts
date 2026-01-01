import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

// Schema de validação para criação de categoria
const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
})

// GET /api/expenses/categories - Listar categorias
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

    const categories = await prisma.expenseCategory.findMany({
      where: {
        organizationId: organization.id,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/expenses/categories - Criar categoria
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
    const validatedData = createCategorySchema.parse(body)

    // Verificar se categoria já existe para a organização
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        name: validatedData.name,
        organizationId: organization.id,
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Categoria com este nome já existe' },
        { status: 400 }
      )
    }

    // Criar categoria
    const category = await prisma.expenseCategory.create({
      data: {
        ...validatedData,
        userId,
        organizationId: organization.id,
      },
    })

    return NextResponse.json(category, { status: 201 })
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

    console.error('Erro ao criar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
