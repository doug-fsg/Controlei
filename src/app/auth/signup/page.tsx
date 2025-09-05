'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (response.ok) {
        router.push('/auth/signin?message=Conta criada com sucesso')
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao criar conta')
      }
    } catch (error) {
      setError('Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
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
            <Music className={cn(
              "h-8 w-8",
              "text-spotify-green-light", // Light mode
              "dark:text-spotify-green", // Dark mode
              "spotify:text-spotify-green" // Spotify mode
            )} />
          </div>
          <CardTitle className={cn(
            "text-2xl font-bold",
            "spotify-text-gradient", // Aplica o gradiente em todos os modos
            "dark:text-white", // Dark mode
            "spotify:text-white" // Spotify mode
          )}>
            Criar Conta
          </CardTitle>
          <CardDescription className={cn(
            "text-muted-foreground", // Light mode
            "dark:text-spotify-light-gray", // Dark mode
            "spotify:text-spotify-light-gray" // Spotify mode
          )}>
            Preencha os dados para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Escolha uma senha"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button type="submit" className="w-full spotify-hover" disabled={loading}>
              {loading ? (
                'Criando...'
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Conta
                </>
              )}
            </Button>
            <div className="text-center text-sm">
              Já tem conta?{' '}
              <Button
                variant="link"
                className="p-0"
                onClick={() => router.push('/auth/signin')}
              >
                Fazer login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
