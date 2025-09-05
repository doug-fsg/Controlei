import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-utils'

// Schema de validação para atualização de venda
const updateSaleSchema = z.object({
  clientId: z.number().positive('Cliente é obrigatório').optional(),
  totalAmount: z.number().positive('Valor deve ser positivo').optional(),
  saleDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

// GET /api/sales/[id] - Buscar venda específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const saleId = parseInt(params.id)

    if (isNaN(saleId)) {
      return NextResponse.json(
        { error: 'ID da venda inválido' },
        { status: 400 }
      )
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        userId,
      },
      include: {
        client: true,
        payments: {
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(sale)
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autorizado') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('Erro ao buscar venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/sales/[id] - Atualizar venda
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const saleId = parseInt(params.id)

    if (isNaN(saleId)) {
      return NextResponse.json(
        { error: 'ID da venda inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateSaleSchema.parse(body)

    // Verificar se a venda existe e pertence ao usuário
    const existingSale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        userId,
      },
    })

    if (!existingSale) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    // Se clientId foi fornecido, verificar se o cliente existe
    if (validatedData.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: validatedData.clientId,
          userId,
        },
      })

      if (!client) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        )
      }
    }

    // Atualizar venda em uma transação para garantir consistência
    const updatedSale = await prisma.$transaction(async (tx) => {
      // Atualizar dados básicos da venda
      const sale = await tx.sale.update({
        where: { id: saleId },
        data: {
          ...(validatedData.clientId && { clientId: validatedData.clientId }),
          ...(validatedData.totalAmount && { totalAmount: validatedData.totalAmount }),
          ...(validatedData.saleDate && { saleDate: new Date(validatedData.saleDate) }),
          ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        },
        include: {
          client: true,
          payments: {
            orderBy: {
              dueDate: 'asc',
            },
          },
        },
      })

      // Se o valor total mudou, adicionar log ou notificação
      if (validatedData.totalAmount && validatedData.totalAmount !== existingSale.totalAmount) {
        console.log(`Venda ${saleId}: Valor alterado de ${existingSale.totalAmount} para ${validatedData.totalAmount}`)
        
        // Verificar se há inconsistências com pagamentos
        const totalPayments = sale.payments.reduce((sum, p) => sum + p.amount, 0)
        if (totalPayments > 0 && totalPayments !== sale.totalAmount) {
          console.warn(`Atenção: Total de pagamentos (${totalPayments}) diferente do valor da venda (${sale.totalAmount})`)
        }
      }

      return sale
    })

    return NextResponse.json(updatedSale)
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autorizado') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/sales/[id] - Excluir venda
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const saleId = parseInt(params.id)

    if (isNaN(saleId)) {
      return NextResponse.json(
        { error: 'ID da venda inválido' },
        { status: 400 }
      )
    }

    // Verificar se a venda existe e pertence ao usuário
    const existingSale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        userId,
      },
    })

    if (!existingSale) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    // Excluir venda (os pagamentos serão excluídos automaticamente devido ao onDelete: Cascade)
    await prisma.sale.delete({
      where: { id: saleId },
    })

    return NextResponse.json({ message: 'Venda excluída com sucesso' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autorizado') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('Erro ao excluir venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
