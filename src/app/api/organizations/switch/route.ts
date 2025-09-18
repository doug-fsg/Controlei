import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireOrganizationAccess } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

// Schema para validação do corpo da requisição
const switchOrgSchema = z.object({
  organizationId: z.number().int().positive('ID da organização inválido')
})

// POST /api/organizations/switch - Alternar para outra organização
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    
    // Validar corpo da requisição
    const body = await request.json()
    const { organizationId } = switchOrgSchema.parse(body)
    
    // Verificar se o usuário tem acesso à organização
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true
          }
        }
      }
    })
    
    if (!userOrg || !userOrg.isActive) {
      return NextResponse.json(
        { error: 'Você não tem acesso a esta organização' },
        { status: 403 }
      )
    }
    
    // Retornar a organização selecionada
    return NextResponse.json({
      id: userOrg.organization.id,
      name: userOrg.organization.name,
      slug: userOrg.organization.slug,
      logoUrl: userOrg.organization.logoUrl,
      role: userOrg.role
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message === 'Não autorizado') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('❌ [SWITCH ORG API] Erro ao alternar organização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
