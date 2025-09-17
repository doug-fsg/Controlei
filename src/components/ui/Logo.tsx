import Image from 'next/image'
import Link from 'next/link'
import { useOrganization } from '@/hooks/useOrganization'

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
  const logoSrc = organization?.logoUrl || '/logo.png'
  const logoAlt = organization?.name || 'Controlei'
  
  // Se ainda está carregando, usar logo padrão
  if (loading) {
    return (
      <Link href="/dashboard" className={`flex items-center gap-2 ${className}`}>
        <Image
          src="/logo.png"
          alt="Controlei"
          width={config.width}
          height={config.height}
          className="object-contain"
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
        {showText && (
          <span className={`font-semibold text-gray-900 ${textSizeClasses[size]}`}>
            Controlei
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link href="/dashboard" className={`flex items-center gap-2 ${className}`}>
      <Image
        src={logoSrc}
        alt={logoAlt}
        width={config.width}
        height={config.height}
        className="object-contain"
        style={{ width: 'auto', height: 'auto' }}
        priority
      />
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
  const { organization, loading } = useOrganization()
  
  // Para ícone, usar logo personalizada ou ícone padrão
  const iconSrc = organization?.logoUrl || '/icon.png'
  const iconAlt = organization?.name || 'Controlei'
  
  // Se ainda está carregando, usar ícone padrão
  if (loading) {
    console.log('🎨 [LogoIcon Component] Ainda carregando, usando ícone padrão')
    return (
      <Link href="/dashboard" className={`flex items-center justify-center ${className}`}>
        <Image
          src="/icon.png"
          alt="Controlei"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
      </Link>
    )
  }
  
  return (
    <Link href="/dashboard" className={`flex items-center justify-center ${className}`}>
      <Image
        src={iconSrc}
        alt={iconAlt}
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
        style={{ width: 'auto', height: 'auto' }}
        priority
      />
    </Link>
  )
}
