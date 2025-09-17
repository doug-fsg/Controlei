'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import DashboardLayout from './DashboardLayout'
import { 
  Users, 
  Building
} from 'lucide-react'

interface SettingsSection {
  id: string
  title: string
  icon: any
  href: string
  description: string
}

const settingsSections: SettingsSection[] = [
  {
    id: 'organization',
    title: 'Organização',
    icon: Building,
    href: '/settings',
    description: 'Informações gerais e logo da organização'
  },
  {
    id: 'users',
    title: 'Usuários',
    icon: Users,
    href: '/settings/users',
    description: 'Gerenciar membros e convites'
  }
]

interface SettingsLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function SettingsLayout({ 
  children, 
  title = "Configurações",
  description = "Gerencie as configurações da sua organização"
}: SettingsLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const currentSection = settingsSections.find(section => 
    pathname === section.href || (section.href !== '/settings' && pathname.startsWith(section.href))
  ) || settingsSections[0]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="flex gap-6">
          {/* Settings Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon
                const isActive = pathname === section.href || 
                  (section.href !== '/settings' && pathname.startsWith(section.href))
                
                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg text-sm transition-colors",
                      "hover:bg-muted/50",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 mt-0.5 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="space-y-1">
                      <div className={cn(
                        "font-medium",
                        isActive ? "text-primary" : "text-foreground"
                      )}>
                        {section.title}
                      </div>
                      <div className="text-xs text-muted-foreground leading-tight">
                        {section.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
