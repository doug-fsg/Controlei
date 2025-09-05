import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-utils'

// Schema de validação para criação de venda
const createSaleSchema = z.object({
  clientId: z.number().positive('Cliente é obrigatório'),
  totalAmount: z.number().positive('Valor deve ser positivo'),
  saleDate: z.string().datetime(),
  notes: z.string().optional(),
  advances: z.array(z.object({
    amount: z.number().positive(),
    dueDate: z.string().datetime(),
  })).optional(),
  installments: z.object({
    remainingAmount: z.number().positive(),
    numberOfInstallments: z.number().int().min(2),
    startDate: z.string().datetime(),
  }).optional(),
})

// GET /api/sales - Listar vendas
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()

    const sales = await prisma.sale.findMany({
      where: {
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
      orderBy: {
        saleDate: 'desc',
      },
    })

    return NextResponse.json(sales)
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autorizado') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('Erro ao buscar vendas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/sales - Criar venda
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    
    const body = await request.json()
    
    // Validar dados
    const validatedData = createSaleSchema.parse(body)

    // Verificar se cliente existe e pertence ao usuário
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

    // Criar venda com pagamentos em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar venda
      const sale = await tx.sale.create({
        data: {
          clientId: validatedData.clientId,
          totalAmount: validatedData.totalAmount,
          saleDate: new Date(validatedData.saleDate),
          notes: validatedData.notes,
          userId,
        },
      })

      // Criar pagamentos (entradas)
      const payments = []
      if (validatedData.advances) {
        for (const advance of validatedData.advances) {
          const payment = await tx.salePayment.create({
            data: {
              saleId: sale.id,
              type: 'ADVANCE',
              amount: advance.amount,
              dueDate: new Date(advance.dueDate),
              status: 'PENDING',
            },
          })
          payments.push(payment)
        }
      }

      // Criar parcelas
      if (validatedData.installments) {
        const { remainingAmount, numberOfInstallments, startDate } = validatedData.installments
        const installmentAmount = remainingAmount / numberOfInstallments

        for (let i = 0; i < numberOfInstallments; i++) {
          const dueDate = new Date(startDate)
          dueDate.setMonth(dueDate.getMonth() + i)

          const payment = await tx.salePayment.create({
            data: {
              saleId: sale.id,
              type: 'INSTALLMENT',
              amount: installmentAmount,
              dueDate,
              status: 'PENDING',
              installmentNumber: i + 1,
              totalInstallments: numberOfInstallments,
            },
          })
          payments.push(payment)
        }
      }

      return { sale, payments }
    })

    // Buscar venda completa para retornar
    const completeSale = await prisma.sale.findUnique({
      where: { id: result.sale.id },
      include: {
        client: true,
        payments: {
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    })

    return NextResponse.json(completeSale, { status: 201 })
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

    console.error('Erro ao criar venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
