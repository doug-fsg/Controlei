import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireAuth, getCurrentOrganization, requireOrganizationAccess } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

// Schema para criar convite
const inviteUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['owner', 'admin', 'member']).default('member')
})

// GET /api/organizations/users - Listar usuários da organização
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

    // Verificar se o usuário tem acesso à organização
    await requireOrganizationAccess(organization.id)
    
    // Buscar usuários da organização
    const organizationUsers = await prisma.userOrganization.findMany({
      where: { 
        organizationId: organization.id,
        isActive: true 
      },
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
      },
      orderBy: {
        joinedAt: 'asc'
      }
    })

    const users = organizationUsers.map(orgUser => ({
      id: orgUser.user.id,
      name: orgUser.user.name,
      email: orgUser.user.email,
      role: orgUser.role,
      joinedAt: orgUser.joinedAt,
      isActive: orgUser.isActive,
      emailVerified: orgUser.user.emailVerified,
      createdAt: orgUser.user.createdAt
    }))

    return NextResponse.json(users)
  } catch (error) {
    console.error('💥 [ORG USERS API] Erro completo:', error)
    
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('❌ [ORG USERS API] Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/organizations/users - Convidar/Criar usuário na organização
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    // Verificar se o usuário tem acesso e é owner/admin
    const userAccess = await requireOrganizationAccess(organization.id)
    if (!['owner', 'admin'].includes(userAccess.role)) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para convidar usuários' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = inviteUserSchema.parse(body)

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    let newUser
    
    if (existingUser) {
      // Verificar se já está na organização
      const existingMembership = await prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId: organization.id
          }
        }
      })

      if (existingMembership) {
        return NextResponse.json(
          { error: 'Usuário já faz parte desta organização' },
          { status: 400 }
        )
      }

      newUser = existingUser
    } else {
      // Criar novo usuário
      const hashedPassword = await bcrypt.hash(validatedData.password, 12)
      
      newUser = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
        }
      })
    }

    // Adicionar usuário à organização
    const userOrganization = await prisma.userOrganization.create({
      data: {
        userId: newUser.id,
        organizationId: organization.id,
        role: validatedData.role,
        isActive: true
      },
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
      id: userOrganization.user.id,
      name: userOrganization.user.name,
      email: userOrganization.user.email,
      role: userOrganization.role,
      joinedAt: userOrganization.joinedAt,
      isActive: userOrganization.isActive,
      emailVerified: userOrganization.user.emailVerified,
      createdAt: userOrganization.user.createdAt
    }

    return NextResponse.json(result, { status: 201 })
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

    console.error('❌ [ORG USERS API] Erro ao convidar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
