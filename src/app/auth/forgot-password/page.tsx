'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao enviar email de recuperação')
      } else {
        setSuccess(true)
      }
    } catch (error) {
      setError('Erro ao processar solicitação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      "bg-background",
      "dark:bg-gradient-to-br dark:from-spotify-black dark:to-spotify-dark-gray",
      "spotify:bg-gradient-to-br spotify:from-spotify-black spotify:to-spotify-dark-gray"
    )}>
      <Card className="w-full max-w-md spotify-card spotify-hover">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className={cn(
            "text-2xl font-bold",
            "text-spotify-green-light",
            "dark:text-spotify-green",
            "spotify:text-spotify-green"
          )}>
            Esqueci minha senha
          </CardTitle>
          <CardDescription className={cn(
            "text-muted-foreground",
            "dark:text-spotify-light-gray",
            "spotify:text-spotify-light-gray"
          )}>
            Digite seu email para receber instruções de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Email enviado! Verifique sua caixa de entrada para instruções de recuperação de senha.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/auth/signin')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <Button type="submit" className="w-full spotify-hover" disabled={loading}>
                {loading ? (
                  'Enviando...'
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar instruções
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => router.push('/auth/signin')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

