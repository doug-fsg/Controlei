"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Users,
  ShoppingCart,
  Loader2,
  Calendar,
  BarChart3
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import { useCashFlow, type CashFlowFilters } from "@/hooks/useCashFlow";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useDashboard()
  
  // Buscar dados de projeção para o gráfico
  const projectionFilters: CashFlowFilters = {
    type: 'ALL',
    status: 'ALL',
    period: 'year',
    dateFrom: '',
    dateTo: '',
  }
  const { data: cashFlowResponse } = useCashFlow(projectionFilters)
  const monthlyProjection = (cashFlowResponse as any)?.monthlyProjection || []

  // Loading state com skeleton
  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>

            {/* Cards Skeleton */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="spotify-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Cards Skeleton */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="spotify-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart Skeleton */}
            <Card className="spotify-hover">
              <CardHeader>
                <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // Error state
  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Card className="p-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>Erro ao carregar dados do dashboard. Tente recarregar a página.</p>
              </div>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
        <div>
          <h1 className={cn(
            "text-3xl font-bold",
            "spotify-text-gradient", // Aplica o gradiente em todos os modos
            "dark:text-white", // Dark mode
            "spotify:text-white" // Spotify mode
          )}>
            Dashboard
          </h1>
          <p className={cn(
            "text-muted-foreground", // Light mode
            "dark:text-spotify-light-gray", // Dark mode
            "spotify:text-spotify-light-gray" // Spotify mode
          )}>
            Visão geral do mês
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="spotify-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
              <TrendingUp className={cn(
                "h-4 w-4",
                "text-spotify-green-light", // Light mode - verde escuro
                "dark:text-spotify-green", // Dark mode
                "spotify:text-spotify-green" // Spotify mode
              )} />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                "text-spotify-green-light", // Light mode - verde escuro
                "dark:text-spotify-green", // Dark mode
                "spotify:text-spotify-green" // Spotify mode
              )}>
                {formatCurrency(dashboardData?.totalIncome || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Vendas do mês atual
              </p>
            </CardContent>
          </Card>

          <Card className="spotify-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(dashboardData?.totalExpenses || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Despesas do mês atual
              </p>
            </CardContent>
          </Card>

          <Card className="spotify-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
              <DollarSign className={cn(
                "h-4 w-4",
                dashboardData?.netBalance && dashboardData.netBalance >= 0
                  ? "text-spotify-green-light dark:text-spotify-green spotify:text-spotify-green"
                  : "text-red-600"
              )} />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                dashboardData?.netBalance && dashboardData.netBalance >= 0
                  ? "text-spotify-green-light dark:text-spotify-green spotify:text-spotify-green"
                  : "text-red-600"
              )}>
                {formatCurrency(dashboardData?.netBalance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.netBalance && dashboardData.netBalance >= 0 ? 'Lucro' : 'Prejuízo'} do período
              </p>
            </CardContent>
          </Card>

          <Card className="spotify-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos em Atraso</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData?.overduePayments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Necessitam atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Pendências - Mais Sutil */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="spotify-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">A Receber</p>
                  <div className={cn(
                    "text-lg font-bold",
                    "text-spotify-green-light dark:text-spotify-green spotify:text-spotify-green"
                  )}>
                    {formatCurrency(dashboardData?.pendingIncome || 0)}
                  </div>
                </div>
                <TrendingUp className={cn(
                  "h-5 w-5",
                  "text-spotify-green-light dark:text-spotify-green spotify:text-spotify-green"
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="spotify-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">A Pagar</p>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(dashboardData?.pendingExpenses || 0)}
                  </div>
                </div>
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Projeção de Fluxo */}
        <Card className="spotify-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className={cn(
                "h-5 w-5",
                "text-spotify-green-light dark:text-spotify-green spotify:text-spotify-green"
              )} />
              <span>Projeção de Fluxo - Próximos 12 Meses</span>
              <Badge variant="outline" className="text-xs">
                Parcelas e Despesas Fixas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyProjection.length > 0 ? (
              <ChartContainer
                config={{
                  income: {
                    label: "Entradas",
                    color: "hsl(142, 76%, 36%)",
                  },
                  expenses: {
                    label: "Saídas", 
                    color: "hsl(0, 84%, 60%)",
                  },
                }}
                className="aspect-auto h-[300px] w-full"
              >
                <AreaChart data={monthlyProjection}>
                  <defs>
                    <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-income)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-income)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-expenses)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-expenses)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => `Mês: ${value}`}
                        formatter={(value, name) => [
                          formatCurrency(Number(value)), 
                          name === 'income' ? 'Entradas' : 'Saídas'
                        ]}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    dataKey="expenses"
                    type="natural"
                    fill="url(#fillExpenses)"
                    stroke="var(--color-expenses)"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="income"
                    type="natural"
                    fill="url(#fillIncome)"
                    stroke="var(--color-income)"
                    strokeWidth={2}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Dados insuficientes para projeção</p>
                <p className="text-xs">Adicione vendas parceladas e despesas fixas para ver a projeção</p>
              </div>
            )}
            
            {/* Alertas de Déficit */}
            {monthlyProjection.some((month: any) => month.balance < 0) && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Atenção: Déficit Projetado</span>
                </div>
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {monthlyProjection
                    .filter((month: any) => month.balance < 0)
                    .map((month: any) => (
                      <div key={month.monthKey}>
                        <strong>{month.month}</strong>: {formatCurrency(month.balance)}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade Recente - Estilo similar às outras páginas */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="spotify-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShoppingCart className={cn(
                  "h-4 w-4",
                  "text-spotify-green-light", // Light mode
                  "dark:text-spotify-green", // Dark mode
                  "spotify:text-spotify-green" // Spotify mode
                )} />
                Vendas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.recentSales && dashboardData.recentSales.length > 0 ? (
                  dashboardData.recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors spotify-hover">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{sale.client}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(sale.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(sale.amount)}</p>
                        <Badge 
                          variant={sale.status === 'paid' ? 'default' : 'secondary'}
                          className={sale.status === 'paid' ? cn(
                            "bg-spotify-green-light text-white border-spotify-green-light", // Light mode
                            "dark:bg-spotify-green dark:text-spotify-black dark:border-spotify-green", // Dark mode
                            "spotify:bg-spotify-green spotify:text-spotify-black spotify:border-spotify-green" // Spotify mode
                          ) : ""}
                        >
                          {sale.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Nenhuma venda recente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="spotify-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Despesas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.recentExpenses && dashboardData.recentExpenses.length > 0 ? (
                  dashboardData.recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors spotify-hover">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{expense.supplier}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(expense.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(expense.amount)}</p>
                        <Badge 
                          variant={expense.status === 'paid' ? 'default' : 'secondary'}
                          className={expense.status === 'paid' ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}
                        >
                          {expense.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Nenhuma despesa recente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card de Relatórios - Link rápido */}
        <Card className="spotify-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              Relatórios Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Acesse análises detalhadas de fluxo de caixa e inadimplência
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/reports'}
                className="spotify-hover"
              >
                Ver Relatórios
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
