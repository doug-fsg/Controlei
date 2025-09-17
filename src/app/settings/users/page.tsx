'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'
import SettingsLayout from '@/components/layout/SettingsLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  UserPlus, 
  MoreHorizontal, 
  Shield, 
  User, 
  Crown, 
  Mail, 
  Calendar, 
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  Edit3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrganizationUser {
  id: number
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
}

export default function UsersSettingsPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<OrganizationUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member' as 'owner' | 'admin' | 'member'
  })

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/organizations/users')
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários da organização",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)

    try {
      const response = await fetch('/api/organizations/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao convidar usuário')
      }

      const newUser = await response.json()
      setUsers(prev => [...prev, newUser])
      setIsInviteDialogOpen(false)
      setFormData({ name: '', email: '', password: '', role: 'member' })
      
      toast({
        title: "Sucesso",
        description: "Usuário adicionado com sucesso à organização"
      })
    } catch (error) {
      console.error('Erro ao convidar usuário:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao convidar usuário',
        variant: "destructive"
      })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/organizations/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar usuário')
      }

      const updatedUser = await response.json()
      setUsers(prev => prev.map(user => 
        user.id === userId ? updatedUser : user
      ))
      
      toast({
        title: "Sucesso",
        description: "Role do usuário atualizado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
        variant: "destructive"
      })
    }
  }

  const handleRemoveUser = async (userId: number) => {
    if (!confirm('Tem certeza que deseja remover este usuário da organização?')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao remover usuário')
      }

      setUsers(prev => prev.filter(user => user.id !== userId))
      
      toast({
        title: "Sucesso",
        description: "Usuário removido da organização"
      })
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao remover usuário',
        variant: "destructive"
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />
      case 'admin':
        return <Shield className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getCurrentUserRole = () => {
    const currentUser = users.find(user => user.email === session?.user?.email)
    return currentUser?.role || 'member'
  }

  const canManageUsers = () => {
    const currentRole = getCurrentUserRole()
    return ['owner', 'admin'].includes(currentRole)
  }

  if (loading) {
    return (
      <SettingsLayout 
        title="Usuários" 
        description="Gerencie os membros da sua organização"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando usuários...</p>
          </div>
        </div>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout 
      title="Usuários" 
      description="Gerencie os membros da sua organização"
    >
      <div className="space-y-6">
        {/* Header com botão de convidar */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Membros da Organização</h2>
            <p className="text-sm text-muted-foreground">
              {users.length} {users.length === 1 ? 'membro' : 'membros'}
            </p>
          </div>
          
          {canManageUsers() && (
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convidar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Convidar Usuário</DialogTitle>
                  <DialogDescription>
                    Adicione um novo membro à sua organização. Se o email já estiver cadastrado, 
                    o usuário será adicionado diretamente. Caso contrário, uma nova conta será criada.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Senha (caso seja um novo usuário)"
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mínimo 6 caracteres. Será usada apenas se for um novo usuário.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Permissão</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'owner' | 'admin' | 'member') => 
                        setFormData(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Membro - Acesso básico
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin - Pode gerenciar usuários
                          </div>
                        </SelectItem>
                        {getCurrentUserRole() === 'owner' && (
                          <SelectItem value="owner">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4" />
                              Owner - Controle total
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={inviteLoading}
                      className="flex-1"
                    >
                      {inviteLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Convidando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Convidar
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(false)}
                      disabled={inviteLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Lista de usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
            <CardDescription>
              Usuários com acesso à organização e suas permissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{user.name}</h4>
                        {user.email === session?.user?.email && (
                          <Badge variant="outline" className="text-xs">
                            Você
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        Membro desde {new Date(user.joinedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getRoleBadgeVariant(user.role)}
                      className="flex items-center gap-1"
                    >
                      {getRoleIcon(user.role)}
                      {user.role === 'owner' ? 'Owner' : 
                       user.role === 'admin' ? 'Admin' : 'Membro'}
                    </Badge>

                    {canManageUsers() && user.email !== session?.user?.email && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleUpdateUserRole(user.id, 'member')}
                            disabled={user.role === 'member'}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Tornar Membro
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateUserRole(user.id, 'admin')}
                            disabled={user.role === 'admin'}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Tornar Admin
                          </DropdownMenuItem>
                          {getCurrentUserRole() === 'owner' && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateUserRole(user.id, 'owner')}
                              disabled={user.role === 'owner'}
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Tornar Owner
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-red-600 focus:text-red-600"
                            disabled={user.role === 'owner' && users.filter(u => u.role === 'owner').length === 1}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações sobre permissões */}
        <Card>
          <CardHeader>
            <CardTitle>Níveis de Permissão</CardTitle>
            <CardDescription>
              Entenda as diferentes permissões disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Owner
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Controle total sobre a organização, incluindo configurações e billing
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Pode gerenciar usuários e acessar todas as funcionalidades
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Membro
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Acesso básico aos dados da organização
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
