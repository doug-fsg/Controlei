import Image from 'next/image'
import Link from 'next/link'
import { useOrganization } from '@/hooks/useOrganization'
import { useMemo } from 'react'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const { organization, loading } = useOrganization()
  
  const sizeConfig = {
    sm: { width: 80, height: 21 },   // Proporção ~3.8:1
    md: { width: 120, height: 32 },  // Proporção ~3.8:1  
    lg: { width: 160, height: 42 }   // Proporção ~3.8:1
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  }

  const config = sizeConfig[size]
  
  // Usar logo personalizada se disponível, senão usar padrão
  const logoSrc = useMemo(() => organization?.logoUrl || '/logo.png', [organization?.logoUrl])
  const logoAlt = useMemo(() => organization?.name || 'Controlei', [organization?.name])
  
  return (
    <Link href="/dashboard" className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={config.width}
          height={config.height}
          className="object-contain max-w-full max-h-full"
          style={{ 
            width: 'auto', 
            height: 'auto',
            maxWidth: `${config.width}px`,
            maxHeight: `${config.height}px`
          }}
          priority
          unoptimized={logoSrc.startsWith('/uploads/')} // Não otimizar logos carregadas pelo usuário
        />
      </div>
      {showText && (
        <span className={`font-semibold text-gray-900 ${textSizeClasses[size]}`}>
          {organization?.name || 'Controlei'}
        </span>
      )}
    </Link>
  )
}

// Componente apenas com ícone (para sidebar compacta)
export function LogoIcon({ className = '' }: { className?: string }) {
  const { organization } = useOrganization()
  
  // Para ícone, usar logo personalizada ou ícone padrão
  const iconSrc = useMemo(() => organization?.logoUrl || '/icon.png', [organization?.logoUrl])
  const iconAlt = useMemo(() => organization?.name || 'Controlei', [organization?.name])
  
  return (
    <Link href="/dashboard" className={`flex items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <Image
          src={iconSrc}
          alt={iconAlt}
          width={32}
          height={32}
          className="object-contain max-w-full max-h-full"
          style={{ 
            width: 'auto', 
            height: 'auto',
            maxWidth: '32px',
            maxHeight: '32px'
          }}
          priority
          unoptimized={iconSrc.startsWith('/uploads/')} // Não otimizar logos carregadas pelo usuário
        />
      </div>
    </Link>
  )
}
