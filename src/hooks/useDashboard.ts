import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'

// Hook para buscar dados do dashboard
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  })
}

