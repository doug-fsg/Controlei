import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false },
        { status: 400 }
      )
    }

    // Buscar token no banco
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { valid: false },
        { status: 200 }
      )
    }

    // Verificar se o token expirou
    const now = new Date()
    if (verificationToken.expires < now) {
      // Deletar token expirado
      await prisma.verificationToken.delete({
        where: { token },
      })
      return NextResponse.json(
        { valid: false },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { valid: true },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao validar token:', error)
    return NextResponse.json(
      { valid: false },
      { status: 200 }
    )
  }
}

