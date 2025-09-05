import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação para criação de categoria
const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
})

// GET /api/expenses/categories - Listar categorias
export async function GET(request: NextRequest) {
  try {
    // TODO: Pegar userId da sessão
    const userId = 1

    const categories = await prisma.expenseCategory.findMany({
      where: {
        userId,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
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
    const body = await request.json()
    
    // Validar dados
    const validatedData = createCategorySchema.parse(body)
    
    // TODO: Pegar userId da sessão
    const userId = 1

    // Verificar se categoria já existe para o usuário
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        name: validatedData.name,
        userId,
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
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
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
