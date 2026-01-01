import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Requer autenticação
    await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    const { filename } = await params

    // Validar nome do arquivo (prevenir path traversal)
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '')
    
    if (!sanitizedFilename.startsWith(`org-${organization.id}.`)) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      )
    }

    const filePath = path.join(process.cwd(), 'uploads', 'logos', sanitizedFilename)
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(filePath)
    const extension = sanitizedFilename.split('.').pop()?.toLowerCase()
    const contentType = extension === 'png' ? 'image/png' : 'image/jpeg'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Security-Policy': "default-src 'self'",
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao carregar imagem' },
      { status: 500 }
    )
  }
}

