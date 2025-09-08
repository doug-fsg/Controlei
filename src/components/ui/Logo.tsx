import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
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

  return (
    <Link href="/dashboard" className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Controlei"
        width={config.width}
        height={config.height}
        className="object-contain"
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

// Componente apenas com ícone (para sidebar compacta)
export function LogoIcon({ className = '' }: { className?: string }) {
  return (
    <Link href="/dashboard" className={`flex items-center justify-center ${className}`}>
      <Image
        src="/icon.png"
        alt="Controlei"
        width={32}
        height={32}
        className="h-8 w-8"
        priority
      />
    </Link>
  )
}
