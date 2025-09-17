import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, getCurrentOrganization, requireOrganizationAccess } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

// Schema para atualizar usuário
const updateUserSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']).optional(),
  isActive: z.boolean().optional()
})

// PUT /api/organizations/users/[id] - Atualizar usuário da organização
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    const targetUserId = parseInt(params.id)
    
    if (!organization || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'Organização ou usuário não encontrado' },
        { status: 400 }
      )
    }

    // Verificar se o usuário tem acesso e é owner/admin
    const userAccess = await requireOrganizationAccess(organization.id)
    if (!['owner', 'admin'].includes(userAccess.role)) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para gerenciar usuários' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Verificar se o usuário alvo existe na organização
    const targetUserOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: organization.id
        }
      }
    })

    if (!targetUserOrg) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na organização' },
        { status: 404 }
      )
    }

    // Não permitir que um usuário altere seu próprio role para não owner se for o único owner
    if (targetUserId === userId && validatedData.role && validatedData.role !== 'owner') {
      const ownerCount = await prisma.userOrganization.count({
        where: {
          organizationId: organization.id,
          role: 'owner',
          isActive: true
        }
      })

      if (ownerCount === 1 && targetUserOrg.role === 'owner') {
        return NextResponse.json(
          { error: 'Não é possível alterar o role do último owner da organização' },
          { status: 400 }
        )
      }
    }

    // Atualizar usuário
    const updatedUserOrg = await prisma.userOrganization.update({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: organization.id
        }
      },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            emailVerified: true
          }
        }
      }
    })

    const result = {
      id: updatedUserOrg.user.id,
      name: updatedUserOrg.user.name,
      email: updatedUserOrg.user.email,
      role: updatedUserOrg.role,
      joinedAt: updatedUserOrg.joinedAt,
      isActive: updatedUserOrg.isActive,
      emailVerified: updatedUserOrg.user.emailVerified,
      createdAt: updatedUserOrg.user.createdAt
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.error('❌ [ORG USER UPDATE API] Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/organizations/users/[id] - Remover usuário da organização
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    const targetUserId = parseInt(params.id)
    
    if (!organization || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'Organização ou usuário não encontrado' },
        { status: 400 }
      )
    }

    // Verificar se o usuário tem acesso e é owner/admin
    const userAccess = await requireOrganizationAccess(organization.id)
    if (!['owner', 'admin'].includes(userAccess.role)) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para gerenciar usuários' },
        { status: 403 }
      )
    }

    // Verificar se o usuário alvo existe na organização
    const targetUserOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: organization.id
        }
      }
    })

    if (!targetUserOrg) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na organização' },
        { status: 404 }
      )
    }

    // Não permitir remover o último owner
    if (targetUserOrg.role === 'owner') {
      const ownerCount = await prisma.userOrganization.count({
        where: {
          organizationId: organization.id,
          role: 'owner',
          isActive: true
        }
      })

      if (ownerCount === 1) {
        return NextResponse.json(
          { error: 'Não é possível remover o último owner da organização' },
          { status: 400 }
        )
      }
    }

    // Remover usuário da organização (soft delete)
    await prisma.userOrganization.update({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: organization.id
        }
      },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.error('❌ [ORG USER DELETE API] Erro ao remover usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
