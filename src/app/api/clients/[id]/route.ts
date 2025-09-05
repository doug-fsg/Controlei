import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/clients/[id] - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    // TODO: Pegar userId da sessão
    const userId = 1

    const client = await prisma.client.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Validar dados
    const validatedData = updateClientSchema.parse(body)
    
    // TODO: Pegar userId da sessão
    const userId = 1

    // Verificar se cliente existe e pertence ao usuário
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar cliente
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...validatedData,
        email: validatedData.email || null,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Deletar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    // TODO: Pegar userId da sessão
    const userId = 1

    // Verificar se cliente existe e pertence ao usuário
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se cliente possui vendas
    const salesCount = await prisma.sale.count({
      where: {
        clientId: id,
      },
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'Cliente não pode ser deletado pois possui vendas vinculadas' },
        { status: 400 }
      )
    }

    // Deletar cliente
    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Cliente deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
