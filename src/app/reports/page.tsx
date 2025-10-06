"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Calendar, Filter, AlertTriangle, DollarSign, BarChart3, Loader2, Download, Eye, EyeOff, Clock, Target, PieChart, Activity } from "lucide-react";

import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCashFlow, type CashFlowFilters, type CashFlowItem } from "@/hooks/useCashFlow";
import { useCategories } from "@/hooks/useCategories";

// Estado inicial dos filtros
const initialFilters: CashFlowFilters = {
  type: 'ALL',
  status: 'ALL',
  period: 'month',
  dateFrom: '',
  dateTo: '',
}

// Função para calcular severidade da inadimplência
const calculateSeverity = (daysOverdue: number) => {
  if (daysOverdue <= 7) return 'LOW';
  if (daysOverdue <= 30) return 'MEDIUM';
  return 'HIGH';
};

export default function ReportsPage() {
  const [filters, setFilters] = useState<CashFlowFilters>(initialFilters);
  const [tempFilters, setTempFilters] = useState<CashFlowFilters>(initialFilters);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Buscar dados reais do fluxo de caixa
  const { data: cashFlowResponse, isLoading, isFetching, error, refetch } = useCashFlow(filters);
  
  // Buscar categorias para o dropdown
  const { data: categories = [] } = useCategories();
  
  // Extrair dados da resposta
  const cashFlowData = (cashFlowResponse as any)?.items || [];
  const summary = (cashFlowResponse as any)?.summary;
  const periodAnalysis = (cashFlowResponse as any)?.periodAnalysis || [];
  const monthlyProjection = (cashFlowResponse as any)?.monthlyProjection || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  };

  const isOverdue = (dueDate: Date | string, status: string) => {
    const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    return status === 'PENDING' && dateObj < new Date();
  };

  const filteredData = cashFlowData.filter((item: any) => {
    if (filters.type !== "ALL" && item.type !== filters.type) return false;
    if (filters.status !== "ALL" && item.status !== filters.status) return false;
    if (filters.dateFrom && new Date(item.dueDate) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(item.dueDate) > new Date(filters.dateTo)) return false;
    return true;
  }).sort((a: any, b: any) => {
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    return dateA - dateB;
  });

  const calculateTotals = (data: CashFlowItem[]) => {
    const totalIncome = data
      .filter(item => item.type === 'INCOME')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const totalExpenses = data
      .filter(item => item.type === 'EXPENSE')
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses,
    };
  };

  const totals = summary || calculateTotals(filteredData);
  
  // Função para definir período rapidamente
  const setQuickPeriod = (period: string) => {
    const now = new Date();
    let dateFrom = '';
    let dateTo = '';
    
    switch (period) {
      case 'today':
        dateFrom = dateTo = now.toISOString().split('T')[0];
        break;
      case 'week':
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateFrom = startOfWeek.toISOString().split('T')[0];
        dateTo = endOfWeek.toISOString().split('T')[0];
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        dateFrom = quarterStart.toISOString().split('T')[0];
        dateTo = quarterEnd.toISOString().split('T')[0];
        break;
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
    }
    
    const newFilters = { ...tempFilters, dateFrom, dateTo, period: period as 'week' | 'month' | 'quarter' | 'year' };
    setTempFilters(newFilters);
    setFilters(newFilters); // Aplicar automaticamente os filtros
    setSelectedPeriod(period);
  };
  
  // Função para limpar filtros
  const clearFilters = () => {
    setTempFilters(initialFilters);
    setFilters(initialFilters);
    setSelectedPeriod('month');
  };

  // Função para aplicar filtros
  const applyFilters = () => {
    setFilters(tempFilters);
  };

  const calculateRunningBalance = () => {
    let runningBalance = 0;
    return filteredData.map((item: any) => {
      if (item.type === 'INCOME') {
        runningBalance += item.amount;
      } else {
        runningBalance -= item.amount;
      }
      return { ...item, runningBalance };
    });
  };

  const dataWithBalance = calculateRunningBalance();
  
  // Função para exportar dados
  const exportToCsv = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Cliente/Fornecedor', 'Valor', 'Status', 'Saldo Acumulado'];
    const csvData = [
      headers.join(','),
      ...dataWithBalance.map((item: any) => [
        formatDate(item.dueDate),
        item.type === 'INCOME' ? 'Entrada' : 'Saída',
        `"${item.description.replace(/"/g, '""')}"`,
        `"${item.clientOrSupplier.replace(/"/g, '""')}"`,
        item.amount.toFixed(2),
        item.status === 'PAID' ? 'Pago' : 'Pendente',
        item.runningBalance.toFixed(2)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fluxo-caixa-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Calcular dados de inadimplência reais
  const overdueData = cashFlowData
    .filter((item: any) => isOverdue(item.dueDate, item.status))
    .map((item: any) => {
      const dueDate = new Date(item.dueDate);
      const now = new Date();
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: item.id,
        clientName: item.clientOrSupplier,
        amount: item.amount,
        daysOverdue,
        severity: calculateSeverity(daysOverdue),
        lastContact: formatDate(item.dueDate),
        description: item.description,
        type: item.type,
      };
    })
    .sort((a: any, b: any) => b.daysOverdue - a.daysOverdue); // Ordenar por dias de atraso (maior primeiro)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'MEDIUM': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'Baixa';
      case 'MEDIUM': return 'Média';
      case 'HIGH': return 'Alta';
      default: return 'N/A';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={cn(
              "text-3xl font-bold",
              "spotify-text-gradient", // Aplica o gradiente em todos os modos
              "dark:text-white", // Dark mode
              "spotify:text-white" // Spotify mode
            )}>
              Relatórios
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className={cn(
              "h-6 w-6",
              "text-spotify-green-light", // Light mode
              "dark:text-spotify-green", // Dark mode
              "spotify:text-spotify-green" // Spotify mode
            )} />
          </div>
        </div>

        <Tabs defaultValue="cashflow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="overdue">Inadimplência</TabsTrigger>
          </TabsList>

          {/* Fluxo de Caixa */}
          <TabsContent value="cashflow" className="space-y-6">
            {/* Loading State - só mostra no carregamento inicial */}
            {isLoading && !cashFlowResponse && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-spotify-green" />
                <span className="ml-2">Carregando dados...</span>
                  </div>
            )}
            
            {/* Error State */}
            {error && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Erro ao carregar dados: {error.message}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => refetch()} 
                    className="mt-4"
                  >
                    Tentar novamente
                  </Button>
                </CardContent>
              </Card>
            )}

            {!error && (cashFlowResponse || !isLoading) && (
              <>
                {/* Filtros Integrados */}
              <Card className="spotify-hover">
                  <CardContent className="p-4">
                    {/* Linha Superior - Período + Botão Expandir */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Período:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { key: 'today', label: 'Hoje' },
                            { key: 'week', label: 'Semana' },
                            { key: 'month', label: 'Mês' },
                            { key: 'quarter', label: 'Trimestre' },
                            { key: 'year', label: 'Ano' },
                          ].map(period => (
                            <Button
                              key={period.key}
                              variant={selectedPeriod === period.key ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setQuickPeriod(period.key)}
                              className={cn(
                                "h-7 px-3 text-xs",
                                selectedPeriod === period.key 
                                  ? "bg-spotify-green text-white hover:bg-spotify-green/90" 
                                  : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                              )}
                            >
                              {period.label}
                            </Button>
                          ))}
                  </div>
            </div>

                      {/* Controles à Direita */}
                      <div className="flex items-center space-x-2">
                        {/* Indicador sutil de atualização */}
                        {isFetching && cashFlowResponse ? (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Atualizando...</span>
                          </div>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Filter className="h-3 w-3 mr-1" />
                          {showAdvancedFilters ? 'Menos filtros' : 'Mais filtros'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={exportToCsv}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          disabled={dataWithBalance.length === 0}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Exportar
                        </Button>
                      </div>
                    </div>

                    {/* Filtros Avançados Expansíveis */}
                    {showAdvancedFilters && (
                      <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                    <Select
                      value={tempFilters.type}
                              onValueChange={(value) => setTempFilters(prev => ({ ...prev, type: value as 'ALL' | 'INCOME' | 'EXPENSE' }))}
                    >
                              <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        <SelectItem value="INCOME">Entradas</SelectItem>
                        <SelectItem value="EXPENSE">Saídas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                    <Select
                      value={tempFilters.status}
                              onValueChange={(value) => setTempFilters(prev => ({ ...prev, status: value as 'ALL' | 'PENDING' | 'PAID' }))}
                    >
                              <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        <SelectItem value="PENDING">Pendente</SelectItem>
                        <SelectItem value="PAID">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                          {/* Dropdown de Categorias - só aparece quando tipo é EXPENSE */}
                          {tempFilters.type === 'EXPENSE' && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
                              <Select
                                value={tempFilters.categoryId?.toString() || 'ALL'}
                                onValueChange={(value) => setTempFilters(prev => ({ 
                                  ...prev, 
                                  categoryId: value === 'ALL' ? undefined : parseInt(value) 
                                }))}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ALL">Todas</SelectItem>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                  <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Inicial</label>
                    <Input
                      type="date"
                      value={tempFilters.dateFrom}
                      onChange={(e) => setTempFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                              className="h-8 text-sm"
                    />
                  </div>

                  <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Final</label>
                    <Input
                      type="date"
                      value={tempFilters.dateTo}
                      onChange={(e) => setTempFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                              className="h-8 text-sm"
                    />
                  </div>
                </div>

                        <div className="flex justify-start gap-2">
                  <Button
                    variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="h-7 px-3 text-xs"
                  >
                    Limpar Filtros
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={applyFilters}
                    className="h-7 px-3 text-xs bg-spotify-green text-white hover:bg-spotify-green/90"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                                {/* KPIs Principais - Compactos */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="spotify-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Total de Vendas</p>
                          <div className={cn(
                            "text-lg font-bold",
                            "text-blue-600 dark:text-blue-400"
                          )}>
                            {formatCurrency(summary?.totalSales || 0)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Valor total das vendas
                          </p>
                        </div>
                        <BarChart3 className={cn(
                          "h-5 w-5",
                          "text-blue-600 dark:text-blue-400"
                        )} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="spotify-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Total de Entradas</p>
                          <div className={cn(
                            "text-lg font-bold",
                            "text-spotify-green-light dark:text-spotify-green spotify:text-spotify-green"
                          )}>
                            {formatCurrency(totals.totalIncome || 0)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Pendente: {formatCurrency(summary?.pendingIncome || 0)}
                          </p>
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
                          <p className="text-xs font-medium text-muted-foreground">Total de Saídas</p>
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(totals.totalExpenses || 0)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Pendente: {formatCurrency(summary?.pendingExpenses || 0)}
                          </p>
                        </div>
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>

                  <Card className="spotify-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Saldo Líquido</p>
                          <div className={cn(
                            "text-lg font-bold",
                            (totals.totalIncome - totals.totalExpenses) >= 0 ? "text-spotify-green" : "text-red-600"
                          )}>
                            {formatCurrency((totals.totalIncome || 0) - (totals.totalExpenses || 0))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(totals.totalIncome - totals.totalExpenses) >= 0 ? 'Superávit' : 'Déficit'}
                          </p>
                        </div>
                        <DollarSign className={cn(
                          "h-5 w-5",
                          (totals.totalIncome - totals.totalExpenses) >= 0 ? "text-spotify-green" : "text-red-600"
                        )} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

            {/* Tabela de Fluxo de Caixa */}
            <Card className="spotify-hover">
              <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Movimentações do Período</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDetails(!showDetails)}
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {showDetails ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                          {showDetails ? 'Menos detalhes' : 'Ver detalhes'}
                        </Button>
                        <Badge variant="outline" className="text-xs">
                          {filteredData.length} itens
                        </Badge>
                      </div>
                    </CardTitle>
              </CardHeader>
              <CardContent className={cn(
                "transition-opacity duration-200",
                isFetching && cashFlowResponse ? "opacity-70" : "opacity-100"
              )}>
                    <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Cliente/Fornecedor</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                            {showDetails && <TableHead className="text-right">Saldo Acumulado</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataWithBalance.map((item: any) => (
                      <TableRow 
                        key={item.id}
                        className={cn(
                          "spotify-hover",
                          isOverdue(item.dueDate, item.status) ? "bg-red-50 dark:bg-red-950/20" : ""
                        )}
                      >
                        <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span>{formatDate(item.dueDate)}</span>
                          {isOverdue(item.dueDate, item.status) && (
                                    <Badge variant="destructive" className="text-xs w-fit mt-1">
                              Vencido
                            </Badge>
                          )}
                                </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.type === 'INCOME' ? 'default' : 'secondary'}
                            className={item.type === 'INCOME' 
                              ? cn(
                                        "bg-spotify-green-light/15 text-spotify-green-light border-spotify-green-light",
                                        "dark:bg-spotify-green/20 dark:text-spotify-green dark:border-spotify-green",
                                        "spotify:bg-spotify-green/20 spotify:text-spotify-green spotify:border-spotify-green"
                                )
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }
                          >
                            {item.type === 'INCOME' ? 'Entrada' : 'Saída'}
                          </Badge>
                        </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{item.description}</span>
                                  {showDetails && item.category && (
                                    <span className="text-xs text-muted-foreground">{item.category}</span>
                                  )}
                                </div>
                              </TableCell>
                        <TableCell>{item.clientOrSupplier}</TableCell>
                        <TableCell className={cn(
                                "font-semibold text-right",
                          item.type === 'INCOME' 
                            ? "text-spotify-green-light dark:text-spotify-green spotify:text-spotify-green"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell>
                                <Badge 
                                  variant={item.status === 'PAID' ? 'default' : 'secondary'}
                                  className={item.status === 'PAID' 
                                    ? "bg-spotify-green/20 text-spotify-green border-spotify-green"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  }
                                >
                            {item.status === 'PAID' ? 'Pago' : 'Pendente'}
                          </Badge>
                        </TableCell>
                              {showDetails && (
                        <TableCell className={cn(
                                  "font-bold text-right",
                          item.runningBalance >= 0 
                            ? "text-spotify-green-light dark:text-spotify-green spotify:text-spotify-green"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {formatCurrency(item.runningBalance)}
                        </TableCell>
                              )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredData.length === 0 && (
                        <div className="text-center py-12">
                          <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <div className="text-muted-foreground">
                            <p className="font-medium">Nenhuma movimentação encontrada</p>
                            <p className="text-sm">Ajuste os filtros ou período para ver os dados</p>
                          </div>
                  </div>
                )}
                    </div>
              </CardContent>
            </Card>

                {/* Análise Temporal */}
                {periodAnalysis.length > 0 && (
                  <Card className="spotify-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className={cn(
                          "h-5 w-5",
                          "text-spotify-green-light dark:text-spotify-green spotify:text-spotify-green"
                        )} />
                        <span>Análise Temporal</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {periodAnalysis.slice(0, 7).map((period: any, index: any) => (
                          <div key={period.date} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-medium">
                                {formatDate(period.date)}
                              </div>
                              <div className="flex space-x-4">
                                <span className="text-xs text-spotify-green">
                                  +{formatCurrency(period.income)}
                                </span>
                                <span className="text-xs text-red-600">
                                  -{formatCurrency(period.expenses)}
                                </span>
                              </div>
                            </div>
                            <div className={cn(
                              "text-sm font-bold",
                              period.netFlow >= 0 
                                ? "text-spotify-green" 
                                : "text-red-600"
                            )}>
                              {formatCurrency(period.netFlow)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Inadimplência */}
          <TabsContent value="overdue" className="space-y-6">
            {/* KPIs de Inadimplência */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Card className="spotify-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total em Atraso</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(overdueData.reduce((sum: any, item: any) => sum + item.amount, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overdueData.length} itens vencidos
                  </p>
                </CardContent>
              </Card>

              <Card className="spotify-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Atraso Médio</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {overdueData.length > 0 
                      ? `${Math.round(overdueData.reduce((sum: any, item: any) => sum + item.daysOverdue, 0) / overdueData.length)} dias`
                      : '0 dias'
                    }
                  </div>
                </CardContent>
              </Card>

              <Card className="spotify-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Severidade Alta</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {overdueData.filter((item: any) => item.severity === 'HIGH').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requer atenção urgente
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="spotify-hover">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span>Relatório de Inadimplência</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {overdueData.length} itens
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overdueData.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto text-spotify-green mb-4" />
                    <div className="text-muted-foreground">
                      <p className="font-medium text-spotify-green">Parabéns! Nenhum item em atraso</p>
                      <p className="text-sm">Todos os pagamentos estão em dia</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                          <TableHead>Cliente/Fornecedor</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Valor em Atraso</TableHead>
                          <TableHead className="text-center">Dias de Atraso</TableHead>
                      <TableHead>Severidade</TableHead>
                          <TableHead>Data de Vencimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                        {overdueData.map((item: any) => (
                      <TableRow key={item.id} className="spotify-hover">
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={item.description}>
                                {item.description}
                              </div>
                        </TableCell>
                        <TableCell>
                              <Badge 
                                variant="outline"
                                className={item.type === 'INCOME' 
                                  ? "text-spotify-green border-spotify-green"
                                  : "text-red-600 border-red-600"
                                }
                              >
                                {item.type === 'INCOME' ? 'Recebimento' : 'Pagamento'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-red-600 dark:text-red-400 font-bold text-right">
                              {formatCurrency(item.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  item.daysOverdue > 30 ? "border-red-600 text-red-600" :
                                  item.daysOverdue > 7 ? "border-orange-600 text-orange-600" :
                                  "border-yellow-600 text-yellow-600"
                                )}
                              >
                                {item.daysOverdue} dias
                              </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(item.severity)}>
                            {getSeverityLabel(item.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {item.lastContact}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
}
