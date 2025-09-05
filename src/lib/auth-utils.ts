import { auth } from './auth'

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
