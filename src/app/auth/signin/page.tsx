'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou senha inválidos')
      } else {
        const session = await getSession()
        if (session) {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      "bg-background", // Light mode
      "dark:bg-gradient-to-br dark:from-spotify-black dark:to-spotify-dark-gray", // Dark mode
      "spotify:bg-gradient-to-br spotify:from-spotify-black spotify:to-spotify-dark-gray" // Spotify mode
    )}>
      <Card className="w-full max-w-md spotify-card spotify-hover">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className={cn(
            "text-2xl font-bold",
            "text-spotify-green-light", // Light mode - mesma cor do botão
            "dark:text-spotify-green", // Dark mode - mesma cor do botão
            "spotify:text-spotify-green" // Spotify mode - mesma cor do botão
          )}>
            Login
          </CardTitle>
          <CardDescription className={cn(
            "text-muted-foreground", // Light mode
            "dark:text-spotify-light-gray", // Dark mode
            "spotify:text-spotify-light-gray" // Spotify mode
          )}>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button type="submit" className="w-full spotify-hover" disabled={loading}>
              {loading ? (
                'Entrando...'
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
            <div className="text-center text-sm">
              Não tem conta?{' '}
              <Button
                variant="link"
                className="p-0"
                onClick={() => router.push('/auth/signup')}
              >
                Criar conta
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
