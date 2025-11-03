import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Não revelar se o email existe ou não (por segurança)
    if (!user) {
      return NextResponse.json(
        { message: 'Se o email existir, você receberá instruções de recuperação' },
        { status: 200 }
      )
    }

    // Gerar token de reset
    const token = randomBytes(32).toString('hex')
    const expires = new Date()
    expires.setHours(expires.getHours() + 1) // Token expira em 1 hora

    // Deletar tokens anteriores do mesmo email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Salvar novo token no banco usando VerificationToken
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: token,
        expires: expires,
      },
    })

    // Configurar transporter de email
    const emailServer = process.env.EMAIL_SERVER
    const emailFrom = process.env.EMAIL_FROM || 'ManyTalks <suporteinovechat@gmail.com>'

    if (!emailServer) {
      console.error('EMAIL_SERVER não configurado')
      return NextResponse.json(
        { error: 'Servidor de email não configurado' },
        { status: 500 }
      )
    }

    // Parse da URL do email server (formato: smtp://user:pass@host:port)
    const url = new URL(emailServer)
    const transporter = nodemailer.createTransport({
      host: url.hostname,
      port: parseInt(url.port) || 587,
      secure: url.port === '465',
      auth: {
        user: decodeURIComponent(url.username),
        pass: decodeURIComponent(url.password),
      },
    })

    // Criar URL de reset
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`

    // Enviar email
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: 'Recuperação de Senha - Sistema Financeiro',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Senha</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1db954 0%, #1ed760 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Recuperação de Senha</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Olá,</p>
              <p>Você solicitou a recuperação de senha para sua conta no Sistema Financeiro.</p>
              <p>Clique no botão abaixo para redefinir sua senha:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #1db954; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Redefinir Senha
                </a>
              </div>
              <p>Ou copie e cole o link abaixo no seu navegador:</p>
              <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
              <p style="margin-top: 30px; color: #999; font-size: 12px;">
                Este link expirará em 1 hora. Se você não solicitou esta recuperação, ignore este email.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
        Recuperação de Senha - Sistema Financeiro
        
        Olá,
        
        Você solicitou a recuperação de senha para sua conta no Sistema Financeiro.
        
        Clique no link abaixo para redefinir sua senha:
        ${resetUrl}
        
        Este link expirará em 1 hora. Se você não solicitou esta recuperação, ignore este email.
      `,
    })

    return NextResponse.json(
      { message: 'Email de recuperação enviado com sucesso' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}

