import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-utils'

// Schema de validação para atualização de venda
const updateSaleSchema = z.object({
  totalAmount: z.number().positive('Valor deve ser positivo').optional(),
  saleDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  advances: z.array(z.object({
    id: z.number().optional(),
    amount: z.number().positive('Valor deve ser positivo'),
    dueDate: z.string().min(1, 'Data é obrigatória'),
  })).optional(),
  installments: z.object({
    remainingAmount: z.number().positive('Valor restante deve ser positivo'),
    numberOfInstallments: z.number().int().positive('Número de parcelas deve ser positivo'),
    startDate: z.string().min(1, 'Data é obrigatória'),
  }).optional(),
})

// GET /api/sales/[id] - Buscar venda específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id } = await params
    const saleId = parseInt(id)

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id } = await params
    const saleId = parseInt(id)

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


    // Buscar venda existente com pagamentos
    const existingSaleWithPayments = await prisma.sale.findFirst({
      where: {
        id: saleId,
        userId,
      },
      include: {
        payments: true,
      },
    })

    if (!existingSaleWithPayments) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar venda em uma transação para garantir consistência
    const updatedSale = await prisma.$transaction(async (tx) => {
      // Calcular novo valor total se parcelas foram fornecidas
      let newTotalAmount = validatedData.totalAmount || existingSale.totalAmount
      
      if (validatedData.advances || validatedData.installments) {
        const totalAdvances = validatedData.advances?.reduce((sum, advance) => sum + advance.amount, 0) || 0
        const remainingAmount = validatedData.installments?.remainingAmount || 0
        newTotalAmount = totalAdvances + remainingAmount
        
        console.log(`Recalculando valor total: Entradas ${totalAdvances} + Restante ${remainingAmount} = ${newTotalAmount}`)
      }

      // Atualizar dados básicos da venda
      const sale = await tx.sale.update({
        where: { id: saleId },
        data: {
          totalAmount: newTotalAmount,
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

      // Processar parcelas se fornecidas
      if (validatedData.advances || validatedData.installments) {
        // Remover TODAS as parcelas existentes (pendentes e pagas)
        await tx.salePayment.deleteMany({
          where: {
            saleId,
          },
        })

        // Criar novas entradas avulsas
        if (validatedData.advances) {
          for (const advance of validatedData.advances) {
            await tx.salePayment.create({
              data: {
                saleId,
                type: 'ADVANCE',
                amount: advance.amount,
                dueDate: new Date(advance.dueDate),
                status: 'PENDING',
              },
            })
          }
        }

        // Criar novas parcelas
        if (validatedData.installments) {
          const { remainingAmount, numberOfInstallments, startDate } = validatedData.installments
          const installmentAmount = remainingAmount / numberOfInstallments

          for (let i = 0; i < numberOfInstallments; i++) {
            const dueDate = new Date(startDate)
            dueDate.setMonth(dueDate.getMonth() + i)

            await tx.salePayment.create({
              data: {
                saleId,
                type: 'INSTALLMENT',
                amount: installmentAmount,
                dueDate,
                status: 'PENDING',
                installmentNumber: i + 1,
                totalInstallments: numberOfInstallments,
              },
            })
          }
        }

        console.log(`Venda ${saleId}: Parcelas atualizadas - Entradas: ${validatedData.advances?.length || 0}, Parcelas: ${validatedData.installments?.numberOfInstallments || 0}`)
      }

      // Buscar venda atualizada com pagamentos
      const updatedSaleWithPayments = await tx.sale.findUnique({
        where: { id: saleId },
        include: {
          client: true,
          payments: {
            orderBy: {
              dueDate: 'asc',
            },
          },
        },
      })

      return updatedSaleWithPayments!
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
        { error: 'Dados inválidos', details: error.issues },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id } = await params
    const saleId = parseInt(id)

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
