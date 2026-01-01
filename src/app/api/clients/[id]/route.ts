import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

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
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const { id } = params
    const clientId = parseInt(id)

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'ID do cliente inválido' },
        { status: 400 }
      )
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: organization.id,
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
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

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
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const { id } = params
    const clientId = parseInt(id)

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'ID do cliente inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateClientSchema.parse(body)

    // Verificar se cliente existe e pertence à organização
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: organization.id,
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
      where: { id: clientId },
      data: {
        ...validatedData,
        email: validatedData.email || null,
      },
    })

    return NextResponse.json(client)
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
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const { id } = params
    const clientId = parseInt(id)

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'ID do cliente inválido' },
        { status: 400 }
      )
    }

    // Verificar se cliente existe e pertence à organização
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: organization.id,
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
        clientId: clientId,
        organizationId: organization.id,
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
      where: { id: clientId },
    })

    return NextResponse.json({ message: 'Cliente deletado com sucesso' })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.error('Erro ao deletar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
