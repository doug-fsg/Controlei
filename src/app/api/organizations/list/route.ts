import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserOrganizations } from '@/lib/auth-utils'

// GET /api/organizations/list - Listar organizações do usuário
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const organizations = await getUserOrganizations()
    
    return NextResponse.json(organizations)
  } catch (error) {
    console.error('💥 [ORG LIST API] Erro completo:', error)
    
    if (error instanceof Error && error.message === 'Não autorizado') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('❌ [ORG LIST API] Erro ao listar organizações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
