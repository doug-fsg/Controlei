import { auth } from './auth'
import { prisma } from './prisma'

export async function getCurrentUser() {
  try {
    const session = await auth()
    return session?.user || null
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error)
    return null
  }
}

export async function getUserIdFromSession(): Promise<number | null> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return null
    }
    
    const userId = parseInt(session.user.id)
    return isNaN(userId) ? null : userId
  } catch (error) {
    console.error('Erro ao obter ID do usuário da sessão:', error)
    return null
  }
}

export async function requireAuth() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    throw new Error('Não autorizado')
  }
  return userId
}

export async function getSessionUser() {
  try {
    const session = await auth()
    return session?.user ? {
      id: parseInt(session.user.id || '0'),
      email: session.user.email || '',
      name: session.user.name || '',
    } : null
  } catch (error) {
    console.error('Erro ao obter usuário da sessão:', error)
    return null
  }
}

// ===== FUNÇÕES MULTI-TENANT =====

export async function getCurrentOrganization(): Promise<{id: number, name: string, slug: string} | null> {
  try {
    const userId = await getUserIdFromSession()
    if (!userId) return null
    
    // Por enquanto, pega a primeira organização ativa do usuário
    const userOrg = await prisma.userOrganization.findFirst({
      where: { 
        userId: userId,
        isActive: true 
      },
      include: { 
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })
    
    return userOrg?.organization || null
  } catch (error) {
    console.error('Erro ao obter organização atual:', error)
    return null
  }
}

export async function requireOrganizationAccess(organizationId: number) {
  try {
    const userId = await requireAuth()
    
    const access = await prisma.userOrganization.findFirst({
      where: { 
        userId, 
        organizationId,
        isActive: true 
      }
    })
    
    if (!access) {
      throw new Error('Acesso negado à organização')
    }
    
    return access
  } catch (error) {
    console.error('Erro ao verificar acesso à organização:', error)
    throw error
  }
}

export async function getUserOrganizations() {
  try {
    const userId = await getUserIdFromSession()
    if (!userId) return []
    
    const userOrgs = await prisma.userOrganization.findMany({
      where: { 
        userId: userId,
        isActive: true 
      },
      include: { 
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    })
    
    return userOrgs.map(uo => ({
      ...uo.organization,
      role: uo.role,
      joinedAt: uo.joinedAt
    }))
  } catch (error) {
    console.error('Erro ao obter organizações do usuário:', error)
    return []
  }
}
