'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/reset-password/validate?token=${token}`)
        const data = await response.json()
        setTokenValid(response.ok && data.valid)
      } catch (error) {
        setTokenValid(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao resetar senha')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      }
    } catch (error) {
      setError('Erro ao processar solicitação')
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        "bg-background",
        "dark:bg-gradient-to-br dark:from-spotify-black dark:to-spotify-dark-gray",
        "spotify:bg-gradient-to-br spotify:from-spotify-black spotify:to-spotify-dark-gray"
      )}>
        <Card className="w-full max-w-md spotify-card spotify-hover">
          <CardContent className="pt-6">
            <div className="text-center">Verificando token...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tokenValid === false) {
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
              Token inválido
            </CardTitle>
            <CardDescription className={cn(
              "text-muted-foreground",
              "dark:text-spotify-light-gray",
              "spotify:text-spotify-light-gray"
            )}>
              O token de recuperação é inválido ou expirou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push('/auth/forgot-password')}
            >
              Solicitar novo link
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            Redefinir senha
          </CardTitle>
          <CardDescription className={cn(
            "text-muted-foreground",
            "dark:text-spotify-light-gray",
            "spotify:text-spotify-light-gray"
          )}>
            Digite sua nova senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Senha redefinida com sucesso! Redirecionando para o login...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <Button type="submit" className="w-full spotify-hover" disabled={loading}>
                {loading ? (
                  'Redefinindo...'
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Redefinir senha
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

