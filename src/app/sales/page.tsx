"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Eye, CheckCircle, Loader2, X, Undo2, TrendingUp, Calendar, ShoppingCart, MoreVertical, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SaleForm from "@/components/sales/SaleForm";
import EditSaleForm from "@/components/sales/EditSaleForm";
import { Sale, SalePayment, CreateSaleData } from "@/types";
import { useSales, useCreateSale, useMarkPaymentAsPaid, useMarkPaymentAsPending, useUpdateSale, useDeleteSale } from "@/hooks/useSales";
import { useClients } from "@/hooks/useClients";

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  
  // Hooks do React Query
  const { data: sales = [], isLoading: salesLoading, error: salesError } = useSales();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const createSaleMutation = useCreateSale();
  const markPaymentMutation = useMarkPaymentAsPaid();
  const markPaymentAsPendingMutation = useMarkPaymentAsPending();
  const updateSaleMutation = useUpdateSale();
  const deleteSaleMutation = useDeleteSale();

  // Estados dos filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Buscar a venda selecionada sempre com os dados mais recentes
  const selectedSale = selectedSaleId ? sales.find(sale => sale.id === selectedSaleId) || null : null;

  const calculateSaleStatus = (sale: Sale) => {
    // Se não há pagamentos (venda à vista), considera como paga
    if (!sale.payments || sale.payments.length === 0) {
      return {
        totalPaid: sale.totalAmount,
        totalPending: 0,
        isFullyPaid: true,
        progress: 100,
        status: 'pago', // Venda à vista
        statusDetails: 'Pago'
      };
    }
    
    const totalPaid = sale.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalPending = sale.payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);

    // Verifica se há pagamentos vencidos
    const overduePayments = sale.payments
      .filter(p => p.status === 'PENDING' && new Date(p.dueDate) < new Date());
    
    // Verifica se há uma parcela pendente que vence neste mês
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const hasCurrentMonthPayment = sale.payments
      .filter(p => p.status === 'PENDING')
      .some(p => {
        const dueDate = new Date(p.dueDate);
        return dueDate.getMonth() === currentMonth && 
               dueDate.getFullYear() === currentYear;
      });
    
    // Verifica se pagou a parcela deste mês
    const paidCurrentMonthPayment = sale.payments
      .filter(p => p.status === 'PAID')
      .some(p => {
        const dueDate = new Date(p.dueDate);
        return dueDate.getMonth() === currentMonth && 
               dueDate.getFullYear() === currentYear;
      });

    let status = 'pendente';
    let statusDetails = '';

    if (overduePayments.length > 0) {
      status = 'vencido';
      statusDetails = `${overduePayments.length} parcela${overduePayments.length > 1 ? 's' : ''} vencida${overduePayments.length > 1 ? 's' : ''}`;
    } else if (totalPending === 0) {
      // Todas as parcelas foram pagas
      status = 'pago';
      statusDetails = 'Todas as parcelas pagas';
    } else if (paidCurrentMonthPayment) {
      // Pagou a parcela deste mês
      status = 'em-dia';
      statusDetails = 'Pagou este mês';
    } else {
      // Ainda tem parcelas pendentes
      status = 'pendente';
      statusDetails = 'Parcelas pendentes';
    }

    return {
      totalPaid,
      totalPending,
      isFullyPaid: totalPending === 0,
      progress: (totalPaid / sale.totalAmount) * 100,
      status,
      statusDetails
    };
  };

  const filteredSales = sales.filter(sale => {
    // Filtro de busca por texto
    const matchesSearch = sale.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de status
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'paid' && calculateSaleStatus(sale).isFullyPaid) ||
                         (statusFilter === 'pending' && !calculateSaleStatus(sale).isFullyPaid);
    
    // Filtro de data
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const saleDate = new Date(sale.saleDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - saleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'today') matchesDate = diffDays === 0;
      else if (dateFilter === 'week') matchesDate = diffDays <= 7;
      else if (dateFilter === 'month') matchesDate = diffDays <= 30;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

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


  // Cálculos do resumo mensal - similar ao expenses
  const monthlyStats = useMemo(() => {
    if (!sales || !Array.isArray(sales)) {
      return {
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
        totalSales: 0,
        paidSales: 0,
        pendingSales: 0,
        paymentProgress: 0
      };
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filtra vendas do mês atual
    const currentMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      return saleDate.getMonth() === currentMonth && 
             saleDate.getFullYear() === currentYear;
    });
    
    // Filtra pagamentos pendentes que vencem no mês atual
    const currentMonthPendingPayments = sales.flatMap(sale => 
      sale.payments
        .filter(payment => payment.status === 'PENDING')
        .filter(payment => {
          const dueDate = new Date(payment.dueDate);
          return dueDate.getMonth() === currentMonth && 
                 dueDate.getFullYear() === currentYear;
        })
        .map(payment => ({
          ...payment,
          clientName: sale.client?.name || 'Cliente não identificado'
        }))
    );
    
    const totalAmount = currentMonthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPaid = currentMonthSales.reduce((sum, sale) => {
      const status = calculateSaleStatus(sale);
      return sum + status.totalPaid;
    }, 0);
    
    // Total pendente apenas do mês atual
    const totalPending = currentMonthPendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const totalSales = currentMonthSales.length;
    const paidSales = currentMonthSales.filter(sale => 
      calculateSaleStatus(sale).isFullyPaid
    ).length;
    
    return {
      totalAmount,
      totalPaid,
      totalPending,
      totalSales,
      paidSales,
      pendingSales: totalSales - paidSales,
      paymentProgress: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      currentMonthPendingPayments // Adiciona para usar na seção "Próximos Recebimentos"
    };
  }, [sales]);

  const handleCreateSale = async (data: CreateSaleData) => {
    try {
      await createSaleMutation.mutateAsync({
        ...data,
        saleDate: data.saleDate.toISOString(),
        advances: data.advances?.map(advance => ({
          amount: advance.amount,
          dueDate: advance.dueDate.toISOString(),
        })),
        installments: data.installments ? {
          remainingAmount: data.installments.remainingAmount,
          numberOfInstallments: data.installments.numberOfInstallments,
          startDate: data.installments.startDate.toISOString(),
        } : undefined,
      });
    } catch (error) {
      console.error('Erro ao criar venda:', error);
    }
  };

  const markPaymentAsPaid = async (saleId: string, paymentId: number) => {
    try {
      await markPaymentMutation.mutateAsync(paymentId);
    } catch (error) {
      console.error('Erro ao marcar pagamento como pago:', error);
    }
  };

  const markPaymentAsPending = async (paymentId: number) => {
    try {
      await markPaymentAsPendingMutation.mutateAsync(paymentId);
    } catch (error) {
      console.error('Erro ao desfazer pagamento:', error);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
  };

  const handleUpdateSale = async (updateData: { id: string; data: any }) => {
    try {
      await updateSaleMutation.mutateAsync(updateData);
      setEditingSale(null);
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      alert('Erro ao atualizar venda. Tente novamente.');
    }
  };

  const handleDeleteSale = (sale: Sale) => {
    setDeletingSale(sale);
  };

  const confirmDeleteSale = async () => {
    if (!deletingSale) return;
    
    try {
      await deleteSaleMutation.mutateAsync(deletingSale.id.toString());
      setDeletingSale(null);
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      alert('Erro ao excluir venda. Tente novamente.');
    }
  };

  // Loading state
  if (salesLoading || clientsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando vendas...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (salesError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro ao carregar vendas</p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
              Vendas
            </h1>
            <p className={cn(
              "text-muted-foreground", // Light mode
              "dark:text-spotify-light-gray", // Dark mode
              "spotify:text-spotify-light-gray" // Spotify mode
            )}>
              Gerencie suas vendas e pagamentos
            </p>
          </div>
          <SaleForm
            onSave={handleCreateSale}
            trigger={
              <Button disabled={createSaleMutation.isPending}>
                {createSaleMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Nova Venda
              </Button>
            }
          />
        </div>

        {/* Resumo Mensal  */}
        <Card className="spotify-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShoppingCart className={cn(
                  "h-4 w-4",
                  "text-spotify-green-light", // Light mode
                  "dark:text-spotify-green", // Dark mode
                  "spotify:text-spotify-green" // Spotify mode
                )} />
                Resumo do Mês
              </CardTitle>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {monthlyStats.totalSales} venda{monthlyStats.totalSales !== 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(monthlyStats.totalAmount)}</div>
              </div>
              <div className="text-center border-x border-gray-100 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Recebido</div>
                <div className={cn(
                  "text-xl font-bold",
                  "text-spotify-green-light", // Light mode
                  "dark:text-spotify-green", // Dark mode
                  "spotify:text-spotify-green" // Spotify mode
                )}>
                  {formatCurrency(monthlyStats.totalPaid)}
                </div>
              </div>
              <div className="text-center border-r border-gray-100 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Pendente</div>
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(monthlyStats.totalPending)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Progresso</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{Math.round(monthlyStats.paymentProgress)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="spotify-hover">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-semibold">Lista de Vendas</CardTitle>
            </div>
            
            {/* Busca integrada e sutil - estilo expenses */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Buscar por cliente ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8 h-8 text-xs w-64 border-gray-200 focus:w-80 transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* Filtros - estilo expenses */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Data da Venda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => {
                  const status = calculateSaleStatus(sale);
                  return (
                    <TableRow 
                      key={sale.id} 
                      className={cn(
                        "spotify-hover",
                        // Adiciona fundo vermelho claro se houver pagamentos vencidos
                        status.status === 'vencido'
                          ? "bg-red-50 dark:bg-red-950/20" 
                          : ""
                      )}
                    >
                      <TableCell className="font-medium">
                        {sale.client?.name}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(sale.totalAmount)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(sale.saleDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="default"
                          className={(() => {
                            switch (status.status) {
                              case 'pago':
                                return cn(
                                  "bg-spotify-green-light text-white border-spotify-green-light", // Light mode
                                  "dark:bg-spotify-green dark:text-spotify-black dark:border-spotify-green", // Dark mode
                                  "spotify:bg-spotify-green spotify:text-spotify-black spotify:border-spotify-green" // Spotify mode
                                );
                              case 'em-dia':
                                return cn(
                                  "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:text-white dark:border-blue-500", // Light mode
                                  "dark:bg-blue-500 dark:text-white dark:border-blue-500", // Dark mode
                                  "spotify:bg-blue-500 spotify:text-white spotify:border-blue-500" // Spotify mode
                                );
                              case 'vencido':
                                return "bg-red-600 text-white border-red-600 dark:bg-red-500 dark:text-white dark:border-red-500";
                              default: // pendente
                                return "bg-gray-500 text-white border-gray-500 dark:bg-gray-400 dark:text-white dark:border-gray-400";
                            }
                          })()}
                        >
                          {(() => {
                            switch (status.status) {
                              case 'pago':
                                return status.statusDetails;
                              case 'em-dia':
                                return 'Em dia';
                              case 'vencido':
                                return status.statusDetails;
                              default: // pendente
                                return 'Pendente';
                            }
                          })()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                status.isFullyPaid 
                                  ? "bg-spotify-green-light dark:bg-spotify-green spotify:bg-spotify-green"
                                  : "bg-blue-600 dark:bg-blue-500"
                              )}
                              style={{ width: `${Math.min(status.progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {Math.round(status.progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedSaleId(sale.id)}
                            className="spotify-hover"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" title="Mais ações" className="spotify-hover">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditSale(sale)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteSale(sale)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredSales.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm ? "Nenhuma venda encontrada com os filtros aplicados" : "Nenhuma venda cadastrada"}
              </div>
            )}
          </CardContent>
        </Card>

                {/* Recebimentos - Estilo similar ao Expenses */}
        <Card className="spotify-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className={cn(
                  "h-4 w-4",
                  "text-spotify-green-light", // Light mode
                  "dark:text-spotify-green", // Dark mode
                  "spotify:text-spotify-green" // Spotify mode
                )} />
                Recebimentos pendentes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyStats.currentMonthPendingPayments && monthlyStats.currentMonthPendingPayments.length > 0 ? 
                  monthlyStats.currentMonthPendingPayments
                  .sort((a, b) => {
                    const dateA = new Date(a.dueDate).getTime();
                    const dateB = new Date(b.dueDate).getTime();
                    return dateA - dateB;
                  })
                  .map((payment) => (
                      <TableRow key={payment.id} className="spotify-hover">
                        <TableCell className="font-medium">{payment.clientName}</TableCell>
                      <TableCell>
                          <Badge variant="outline" className="text-xs">
                          {payment.type === 'ADVANCE' ? 'Entrada' : 
                           `Parcela ${payment.installmentNumber}/${payment.totalInstallments}`}
                        </Badge>
                      </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(payment.dueDate)}
                          </span>
                        </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Pendente</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                            onClick={() => {
                              // Encontra a venda correspondente ao pagamento
                              const sale = sales.find(s => s.payments.some(p => p.id === payment.id));
                              if (sale) {
                                markPaymentAsPaid(sale.id.toString(), payment.id);
                              }
                            }}
                          disabled={markPaymentMutation.isPending}
                            className="spotify-hover"
                        >
                          {markPaymentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Marcar como Pago
                        </Button>
                      </TableCell>
                    </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          Nenhum recebimento pendente para este mês
                        </TableCell>
                      </TableRow>
                    )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes da Venda */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className={cn(
                "text-xl font-semibold",
                "spotify-text-gradient", // Light mode
                "dark:text-white", // Dark mode
                "spotify:text-white" // Spotify mode
              )}>
                Detalhes da Venda
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSaleId(null)}
                className="spotify-hover"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações da Venda */}
                <Card className="spotify-hover">
                  <CardHeader>
                    <CardTitle>Informações da Venda</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Cliente:</span>
                      <p>{selectedSale.client?.name || "Cliente não encontrado"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Valor Total:</span>
                      <p className="font-semibold">{formatCurrency(selectedSale.totalAmount)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Data da Venda:</span>
                      <p>{formatDate(selectedSale.saleDate)}</p>
                    </div>
                    {selectedSale.notes && (
                      <div>
                        <span className="font-medium">Observações:</span>
                        <p>{selectedSale.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status do Pagamento */}
                <Card className="spotify-hover">
                  <CardHeader>
                    <CardTitle>Status do Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const status = calculateSaleStatus(selectedSale);
                      return (
                        <>
                          <div>
                            <span className="font-medium">Valor Pago:</span>
                            <p className={cn(
                              "font-semibold",
                              "text-spotify-green-light", // Light mode
                              "dark:text-spotify-green", // Dark mode
                              "spotify:text-spotify-green" // Spotify mode
                            )}>
                              {formatCurrency(status.totalPaid)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Valor Pendente:</span>
                            <p className="text-red-600 dark:text-red-400 font-semibold">{formatCurrency(status.totalPending)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Progresso:</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-2 rounded-full transition-all duration-300",
                                    status.isFullyPaid 
                                      ? "bg-spotify-green-light dark:bg-spotify-green spotify:bg-spotify-green"
                                      : "bg-blue-600 dark:bg-blue-500"
                                  )}
                                  style={{ width: `${status.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                {Math.round(status.progress)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>
                            <Badge 
                              variant={status.isFullyPaid ? "default" : "secondary"}
                              className={status.isFullyPaid ? cn(
                                "bg-spotify-green-light text-white border-spotify-green-light", // Light mode
                                "dark:bg-spotify-green dark:text-spotify-black dark:border-spotify-green", // Dark mode
                                "spotify:bg-spotify-green spotify:text-spotify-black spotify:border-spotify-green" // Spotify mode
                              ) : ""}
                            >
                              {status.isFullyPaid ? "Pago" : "Pendente"}
                            </Badge>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Pagamentos */}
              <Card className="spotify-hover">
                <CardHeader>
                  <CardTitle>Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data de Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Pagamento</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.payments.map((payment: SalePayment) => (
                        <TableRow key={payment.id} className="spotify-hover">
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {payment.type === 'ADVANCE' ? 'Entrada' : 'Parcela'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(payment.dueDate)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={payment.status === 'PAID' ? "default" : "secondary"}
                              className={payment.status === 'PAID' ? cn(
                                "bg-spotify-green-light text-white border-spotify-green-light", // Light mode
                                "dark:bg-spotify-green dark:text-spotify-black dark:border-spotify-green", // Dark mode
                                "spotify:bg-spotify-green spotify:text-spotify-black spotify:border-spotify-green" // Spotify mode
                              ) : ""}
                            >
                              {payment.status === 'PAID' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {payment.status === 'PENDING' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markPaymentAsPaid(selectedSale.id.toString(), payment.id)}
                                  disabled={markPaymentMutation.isPending}
                                  className="spotify-hover"
                                >
                                  {markPaymentMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                  )}
                                  Marcar como Pago
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markPaymentAsPending(payment.id)}
                                  disabled={markPaymentAsPendingMutation.isPending}
                                  className="text-orange-600 hover:text-orange-700 spotify-hover"
                                >
                                  {markPaymentAsPendingMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Undo2 className="h-4 w-4 mr-1" />
                                  )}
                                  Desfazer Pagamento
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      <EditSaleForm
        sale={editingSale}
        onSave={handleUpdateSale}
        onClose={() => setEditingSale(null)}
        isLoading={updateSaleMutation.isPending}
      />

      {/* Modal de Confirmação de Exclusão */}
      {deletingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Tem certeza que deseja excluir a venda para <strong>"{deletingSale.client?.name}"</strong> no valor de <strong>{formatCurrency(deletingSale.totalAmount)}</strong>?
                <br />
                Esta ação não pode ser desfeita e todos os pagamentos associados também serão removidos.
              </p>
              
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDeletingSale(null)}
                  disabled={deleteSaleMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteSale}
                  disabled={deleteSaleMutation.isPending}
                >
                  {deleteSaleMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Venda
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}