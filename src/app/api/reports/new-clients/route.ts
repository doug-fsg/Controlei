import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

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

    const { searchParams } = new URL(request.url)
    
    // Parâmetros de filtro
    const period = searchParams.get('period') || '30' // Padrão: últimos 30 dias
    const daysAgo = parseInt(period)
    
    // Calcular data de início baseada no período
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    
    // Buscar novos clientes (criados no período)
    const newClients = await prisma.client.findMany({
      where: {
        userId,
        organizationId: organization.id,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        sales: {
          include: {
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Buscar todos os clientes para comparação
    const allClients = await prisma.client.findMany({
      where: { 
        userId,
        organizationId: organization.id,
      },
      include: {
        sales: {
          include: {
            payments: true,
          },
        },
      },
    })

    // Analisar dados dos novos clientes
    const clientsAnalysis = newClients.map(client => {
      const totalSales = client.sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const totalPaid = client.sales
        .flatMap(sale => sale.payments)
        .filter(payment => payment.status === 'PAID')
        .reduce((sum, payment) => sum + payment.amount, 0)
      
      const pendingAmount = totalSales - totalPaid
      const salesCount = client.sales.length
      const averageTicket = salesCount > 0 ? totalSales / salesCount : 0
      
      // Calcular dias desde a primeira compra
      const firstSale = client.sales.sort((a, b) => 
        new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime()
      )[0]
      
      const daysSinceFirstSale = firstSale 
        ? Math.floor((new Date().getTime() - new Date(firstSale.saleDate).getTime()) / (1000 * 60 * 60 * 24))
        : null

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        createdAt: client.createdAt,
        totalSales,
        totalPaid,
        pendingAmount,
        salesCount,
        averageTicket,
        daysSinceFirstSale,
        firstSaleDate: firstSale?.saleDate || null,
        status: pendingAmount > 0 ? 'PENDING' : salesCount > 0 ? 'PAID' : 'NO_SALES',
      }
    })

    // Calcular métricas gerais
    const totalNewClients = newClients.length
    const clientsWithSales = clientsAnalysis.filter(c => c.salesCount > 0).length
    const conversionRate = totalNewClients > 0 ? (clientsWithSales / totalNewClients) * 100 : 0
    
    const totalRevenue = clientsAnalysis.reduce((sum, client) => sum + client.totalSales, 0)
    const totalPaidRevenue = clientsAnalysis.reduce((sum, client) => sum + client.totalPaid, 0)
    const averageTicketNewClients = clientsWithSales > 0 
      ? clientsAnalysis.reduce((sum, client) => sum + client.averageTicket, 0) / clientsWithSales
      : 0

    // Comparar com período anterior
    const previousStartDate = new Date()
    previousStartDate.setDate(previousStartDate.getDate() - (daysAgo * 2))
    previousStartDate.setDate(previousStartDate.getDate() + daysAgo)

    const previousNewClients = await prisma.client.count({
      where: {
        userId,
        organizationId: organization.id,
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    })

    const growthRate = previousNewClients > 0 
      ? ((totalNewClients - previousNewClients) / previousNewClients) * 100
      : totalNewClients > 0 ? 100 : 0

    // Agrupar por data para análise temporal
    const clientsByDate = clientsAnalysis.reduce((acc, client) => {
      const dateKey = new Date(client.createdAt).toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          count: 0,
          revenue: 0,
          clients: [],
        }
      }
      acc[dateKey].count += 1
      acc[dateKey].revenue += client.totalSales
      acc[dateKey].clients.push(client)
      return acc
    }, {} as Record<string, any>)

    const temporalAnalysis = Object.values(clientsByDate).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return NextResponse.json({
      clients: clientsAnalysis,
      temporalAnalysis,
      summary: {
        totalNewClients,
        clientsWithSales,
        conversionRate,
        totalRevenue,
        totalPaidRevenue,
        averageTicketNewClients,
        growthRate,
        period: daysAgo,
        periodLabel: daysAgo === 7 ? 'Última semana' : 
                    daysAgo === 30 ? 'Último mês' : 
                    daysAgo === 90 ? 'Últimos 3 meses' : 
                    `Últimos ${daysAgo} dias`,
        comparisonPeriod: {
          previousNewClients,
          growthRate,
        },
      },
    })

  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('Erro ao gerar relatório de novos clientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

