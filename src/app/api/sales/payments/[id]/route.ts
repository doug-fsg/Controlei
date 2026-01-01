import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

const markPaymentSchema = z.object({
  status: z.enum(['PAID', 'PENDING']),
  paidDate: z.string().datetime().optional(),
})

// PATCH /api/sales/payments/[id] - Marcar pagamento como pago/pendente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const paymentId = parseInt(id, 10)
    
    if (isNaN(paymentId)) {
      return NextResponse.json(
        { error: 'ID do pagamento inválido' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const validatedData = markPaymentSchema.parse(body)

    // Verificar se pagamento existe e pertence à organização
    const payment = await prisma.salePayment.findFirst({
      where: {
        id: paymentId,
        sale: {
          organizationId: organization.id,
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar pagamento
    const updatedPayment = await prisma.salePayment.update({
      where: { id: paymentId },
      data: {
        status: validatedData.status,
        paidDate: validatedData.status === 'PAID' 
          ? (validatedData.paidDate ? new Date(validatedData.paidDate) : new Date())
          : null,
      },
    })

    return NextResponse.json(updatedPayment)
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

    console.error('Erro ao atualizar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
