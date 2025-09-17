import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { requireAuth, getCurrentOrganization } from '@/lib/auth-utils'

// POST /api/organizations/logo - Upload de logo
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

    // Verificar se usuário tem permissão (owner ou admin)
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: organization.id,
        role: { in: ['owner', 'admin'] }
      }
    })

    console.log('🔐 [LOGO API] User organization role:', userOrg?.role)

    if (!userOrg) {
      console.log('❌ [LOGO API] Sem permissão para alterar logo')
      return NextResponse.json(
        { error: 'Sem permissão para alterar logo' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File
    
    console.log('📁 [LOGO API] File received:', file?.name, file?.size, file?.type)
    
    if (!file) {
      console.log('❌ [LOGO API] Arquivo não encontrado')
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 400 }
      )
    }

    // Validações
    const maxSize = 2 * 1024 * 1024 // 2MB
    console.log('📏 [LOGO API] File size check:', file.size, 'bytes (max:', maxSize, ')')
    if (file.size > maxSize) {
      console.log('❌ [LOGO API] Arquivo muito grande')
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 2MB' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    console.log('🎨 [LOGO API] File type check:', file.type, 'allowed:', allowedTypes)
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ [LOGO API] Formato não suportado')
      return NextResponse.json(
        { error: 'Formato não suportado. Use PNG, JPG ou SVG' },
        { status: 400 }
      )
    }

    // Criar diretório se não existir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
    console.log('📂 [LOGO API] Upload directory:', uploadDir)
    if (!existsSync(uploadDir)) {
      console.log('📁 [LOGO API] Criando diretório de upload')
      await mkdir(uploadDir, { recursive: true })
    }

    // Gerar nome do arquivo
    const extension = file.name.split('.').pop()
    const fileName = `org-${organization.id}.${extension}`
    const filePath = path.join(uploadDir, fileName)
    console.log('📝 [LOGO API] File path:', filePath)

    // Salvar arquivo
    console.log('💾 [LOGO API] Salvando arquivo...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    console.log('✅ [LOGO API] Arquivo salvo com sucesso')

    // Atualizar URL no banco
    const logoUrl = `/uploads/logos/${fileName}`
    console.log('🗄️ [LOGO API] Atualizando banco com logoUrl:', logoUrl)
    console.log('🗄️ [LOGO API] Organization ID:', organization.id)
    
    try {
      const updatedOrg = await prisma.organization.update({
        where: { id: organization.id },
        data: { logoUrl }
      })
      console.log('✅ [LOGO API] Banco atualizado com sucesso:', updatedOrg)
    } catch (dbError) {
      console.error('❌ [LOGO API] Erro ao atualizar banco:', dbError)
      throw dbError
    }

    console.log('🎉 [LOGO API] Upload concluído com sucesso')
    return NextResponse.json({ 
      success: true, 
      logoUrl,
      message: 'Logo atualizada com sucesso' 
    })

  } catch (error) {
    console.error('💥 [LOGO API] Erro completo:', error)
    
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      console.log('🔒 [LOGO API] Erro de autorização')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('❌ [LOGO API] Erro ao fazer upload da logo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/organizations/logo - Remover logo
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const organization = await getCurrentOrganization()
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    // Verificar permissão
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: organization.id,
        role: { in: ['owner', 'admin'] }
      }
    })

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Sem permissão para alterar logo' },
        { status: 403 }
      )
    }

    // Remover URL do banco
    await prisma.organization.update({
      where: { id: organization.id },
      data: { logoUrl: null }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Logo removida com sucesso' 
    })

  } catch (error) {
    if (error instanceof Error && (error.message === 'Não autorizado' || error.message === 'Acesso negado à organização')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('Erro ao remover logo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
