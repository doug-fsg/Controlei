import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

// GET /api/organizations/current - Buscar organização atual
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

    return NextResponse.json(organization)
  } catch (error) {
    console.error('💥 [CURRENT ORG API] Erro completo:', error)
    
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      console.log('🔒 [CURRENT ORG API] Erro de autorização')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('❌ [CURRENT ORG API] Erro ao buscar organização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
