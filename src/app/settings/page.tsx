"use client";

import { useState, useRef, useEffect } from 'react'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/useOrganization'
import SettingsLayout from '@/components/layout/SettingsLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Upload, X, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export default function SettingsPage() {
  const { organization, updateLogo } = useOrganization()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validações
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Máximo 2MB",
        variant: "destructive"
      })
      return
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Formato não suportado. Use PNG, JPG ou SVG",
        variant: "destructive"
      })
      return
    }

    setSelectedFile(file)
    
    // Criar preview
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('logo', selectedFile)

      const response = await fetch('/api/organizations/logo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const result = await response.json()
      
      // Limpar preview
      setPreviewUrl(null)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Atualizar logo e mostrar toast
      updateLogo(result.logoUrl)
      toast({
        title: "Sucesso",
        description: "Logo atualizada com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao fazer upload',
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!organization?.logoUrl) return

    setUploading(true)
    
    try {
      const response = await fetch('/api/organizations/logo', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao remover logo')
      }

      updateLogo(null)
      toast({
        title: "Sucesso",
        description: "Logo removida com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao remover logo:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao remover logo',
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const clearPreview = () => {
    setPreviewUrl(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!organization) {
    return (
      <SettingsLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando configurações...</p>
          </div>
        </div>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout 
      title="Organização" 
      description="Gerencie as informações e aparência da sua organização"
    >
      <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Logo da Organização</CardTitle>
            <CardDescription>
              Faça upload de uma logo personalizada para sua organização. 
              Recomendamos imagens com proporção 3.75:1 (ex: 240x64px) para melhor visualização.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Atual */}
            <div>
              <Label className="text-base font-medium">Logo Atual</Label>
              <div className="mt-2 p-4 border rounded-lg bg-muted/25">
                <div className="flex items-center gap-4">
                  <Image
                    src={organization.logoUrl || '/logo.png'}
                    alt={organization.name}
                    width={120}
                    height={32}
                    className="object-contain"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{organization.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {organization.logoUrl ? 'Logo personalizada' : 'Logo padrão do sistema'}
                    </p>
                  </div>
                  {organization.logoUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Upload de Nova Logo */}
            <div>
              <Label className="text-base font-medium">Nova Logo</Label>
              <div className="mt-2">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    "hover:border-primary hover:bg-muted/25",
                    previewUrl && "border-primary bg-muted/25"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          width={120}
                          height={32}
                          className="object-contain border rounded"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearPreview()
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile?.name} ({(selectedFile?.size || 0 / 1024).toFixed(1)} KB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm">
                        Clique para selecionar ou arraste uma imagem
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG ou SVG até 2MB
                      </p>
                    </div>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Botões de Ação */}
            {selectedFile && (
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Logo
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearPreview}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
              </div>
            )}

            {/* Especificações Técnicas */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Especificações recomendadas:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Proporção: 3.75:1 (ex: 240x64px, 300x80px)</li>
                <li>Formatos: PNG (recomendado), JPG, SVG</li>
                <li>Tamanho máximo: 2MB</li>
                <li>Fundo transparente para PNG/SVG</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
