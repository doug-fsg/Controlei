"use client";

import React, { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, CheckCircle, Loader2, Eye, Edit, Trash2, MoreVertical, Calendar, Filter, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { Expense, CreateExpenseData, ExpenseCategory } from "@/types";
import { useExpenses, useCreateExpense, useMarkExpenseAsPaid, useDeleteExpense, usePayRecurringExpense, useRecurringPayments } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";



export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  
  // Estados para filtros (começam vazios para mostrar placeholders)
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current_month");
  
  // Hooks do React Query
  const { data: expenses = [], isLoading: expensesLoading, error: expensesError } = useExpenses();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: recurringPayments = [] } = useRecurringPayments();
  const createExpenseMutation = useCreateExpense();
  const markExpenseAsPaidMutation = useMarkExpenseAsPaid();
  const deleteExpenseMutation = useDeleteExpense();
  const payRecurringExpenseMutation = usePayRecurringExpense();

  // Função para gerar ocorrências virtuais de despesas recorrentes
  const generateRecurringOccurrences = (expenses: Expense[]) => {
    const allExpenses: Expense[] = [];
    const now = new Date();
    
    expenses.forEach(expense => {
      if (expense.isRecurring && expense.recurringFrequency === 'MONTHLY') {
        // Para despesas recorrentes mensais, gerar ocorrências para os próximos 12 meses
        const startDate = new Date(expense.dueDate);
        const dayOfMonth = expense.recurringDayOfMonth || startDate.getDate();
        
        // Gerar ocorrências dos últimos 6 meses até os próximos 12 meses
        for (let i = -6; i <= 12; i++) {
          const occurrenceDate = new Date(now.getFullYear(), now.getMonth() + i, dayOfMonth);
          
          // Verificar se está dentro do período de validade (se endDate definido)
          if (expense.recurringEndDate && occurrenceDate > new Date(expense.recurringEndDate)) {
            continue;
          }
          
          // Verificar se já foi pago neste mês
          const paymentMonth = new Date(occurrenceDate.getFullYear(), occurrenceDate.getMonth(), 1);
          const payment = recurringPayments.find(p => 
            p.expenseId === expense.id && 
            new Date(p.paymentDate).getTime() === paymentMonth.getTime()
          );
          
          // Criar uma cópia virtual da despesa para este mês
          const virtualExpense: Expense = {
            ...expense,
            id: expense.id * 1000 + i + 100, // ID único virtual
            dueDate: occurrenceDate,
            description: `${expense.description} (${occurrenceDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })})`,
            status: payment ? 'PAID' : (occurrenceDate < now ? 'OVERDUE' : 'PENDING'),
            paidAmount: payment ? payment.amount : 0,
            paidDate: payment ? new Date(payment.paidAt) : undefined,
          };
          
          allExpenses.push(virtualExpense);
        }
      } else {
        // Despesas não recorrentes, adicionar normalmente
        allExpenses.push(expense);
      }
    });
    
    return allExpenses;
  };

  // Funções utilitárias
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

  const calculateExpenseStatus = (expense: Expense) => {
    const totalAmount = expense.amount;
    const totalPaid = expense.paidAmount;
    const totalPending = totalAmount - totalPaid;

    return {
      totalPaid,
      totalPending,
      isFullyPaid: totalPending === 0,
      progress: (totalPaid / totalAmount) * 100,
    };
  };

  // Lógica de filtros e ordenação
  const filteredAndSortedExpenses = useMemo(() => {
    // Garantir que expenses é um array válido
    if (!expenses || !Array.isArray(expenses)) {
      return [];
    }
    
    // Gerar ocorrências virtuais para despesas recorrentes
    const expandedExpenses = generateRecurringOccurrences(expenses);
    
    let filtered = expandedExpenses.filter(expense => {
      // Filtro de busca por texto
      const matchesSearch = searchTerm === "" || 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.notes && expense.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro por categoria
      const matchesCategory = selectedCategory === "" || selectedCategory === "all" || 
        (expense.categories && expense.categories.includes(selectedCategory));
      
      // Filtro por status
      const status = calculateExpenseStatus(expense);
      const matchesStatus = selectedStatus === "" || selectedStatus === "all" || 
        (selectedStatus === "paid" && status.isFullyPaid) ||
        (selectedStatus === "pending" && !status.isFullyPaid);
      
      // Filtro por período
      const expenseDate = new Date(expense.dueDate);
      const now = new Date();
      let matchesPeriod = true;
      
      if (selectedPeriod === "current_month") {
        matchesPeriod = expenseDate.getMonth() === now.getMonth() && 
                      expenseDate.getFullYear() === now.getFullYear();
      } else if (selectedPeriod === "next_month") {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1);
        matchesPeriod = expenseDate.getMonth() === nextMonth.getMonth() && 
                      expenseDate.getFullYear() === nextMonth.getFullYear();
      } else if (selectedPeriod === "last_month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        matchesPeriod = expenseDate.getMonth() === lastMonth.getMonth() && 
                      expenseDate.getFullYear() === lastMonth.getFullYear();
      } else if (selectedPeriod === "current_year") {
        matchesPeriod = expenseDate.getFullYear() === now.getFullYear();
      } else if (selectedPeriod === "overdue") {
        matchesPeriod = expenseDate < now && !status.isFullyPaid;
      }
      
      return matchesSearch && matchesCategory && matchesStatus && matchesPeriod;
    });
    
    // Ordenar por data de vencimento (mais próximos primeiro)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      const now = new Date(); // Definir now aqui também
      
      // Se ambas as datas já passaram, mostrar primeiro as mais recentes
      if (dateA < now && dateB < now) {
        return dateB.getTime() - dateA.getTime();
      }
      
      // Se ambas as datas estão no futuro, mostrar primeiro as mais próximas
      if (dateA >= now && dateB >= now) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // Se uma está no passado e outra no futuro, mostrar a do futuro depois
      if (dateA < now && dateB >= now) {
        return -1;
      }
      if (dateA >= now && dateB < now) {
        return 1;
      }
      
      return 0;
    });
  }, [expenses, recurringPayments, searchTerm, selectedCategory, selectedStatus, selectedPeriod]);

  // Cálculos do resumo mensal
  const monthlyStats = useMemo(() => {
    // Garantir que expenses é um array válido
    if (!expenses || !Array.isArray(expenses)) {
      return {
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
        totalExpenses: 0,
        paidExpenses: 0,
        pendingExpenses: 0,
        paymentProgress: 0
      };
    }
    
    // Usar despesas expandidas para cálculos também
    const expandedExpenses = generateRecurringOccurrences(expenses);
    const now = new Date();
    const currentMonthExpenses = expandedExpenses.filter(expense => {
      const expenseDate = new Date(expense.dueDate);
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    });
    
    const totalAmount = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalPaid = currentMonthExpenses.reduce((sum, expense) => sum + expense.paidAmount, 0);
    const totalPending = totalAmount - totalPaid;
    const totalExpenses = currentMonthExpenses.length;
    const paidExpenses = currentMonthExpenses.filter(expense => 
      calculateExpenseStatus(expense).isFullyPaid
    ).length;
    
    return {
      totalAmount,
      totalPaid,
      totalPending,
      totalExpenses,
      paidExpenses,
      pendingExpenses: totalExpenses - paidExpenses,
      paymentProgress: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0
    };
  }, [expenses, recurringPayments]);



  const handleCreateExpense = async (data: CreateExpenseData) => {
    try {
      const apiData = {
        description: data.description,
        amount: data.amount,
        dueDate: data.dueDate.toISOString(),
        categoryId: parseInt(data.categories[0]), // API espera categoryId como number
        notes: data.notes,
        ...(data.installments && {
          installments: {
            numberOfInstallments: data.installments.numberOfInstallments,
            dayOfMonth: data.installments.dayOfMonth,
          }
        }),
        ...(data.recurring && {
          recurring: {
            frequency: data.recurring.frequency.toUpperCase() as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
            dayOfMonth: data.recurring.dayOfMonth,
            endDate: data.recurring.endDate?.toISOString(),
          }
        })
      };
      
      await createExpenseMutation.mutateAsync(apiData);
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
    }
  };

  const handleMarkAsPaid = async (expense: Expense) => {
    try {
      // Verificar se é uma despesa recorrente virtual
      if (expense.id > 1000) {
        // É uma despesa virtual, extrair o ID real e usar API de pagamento recorrente
        const realExpenseId = Math.floor(expense.id / 1000);
        await payRecurringExpenseMutation.mutateAsync({
          expenseId: realExpenseId,
          paymentDate: expense.dueDate.toISOString(),
          amount: expense.amount,
        });
      } else {
        // Despesa normal, usar API padrão
        await markExpenseAsPaidMutation.mutateAsync(expense.id);
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    // TODO: Implementar modal de edição
    alert('Funcionalidade de edição será implementada em breve!');
  };

  const handleDeleteExpense = (expense: Expense) => {
    setDeletingExpense(expense);
  };

  const confirmDeleteExpense = async () => {
    if (!deletingExpense) return;
    
    try {
      await deleteExpenseMutation.mutateAsync(deletingExpense.id);
      setDeletingExpense(null);
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
    }
  };

  // Funções de categoria removidas - agora são tratadas pelos hooks internamente

  // markExpenseAsPaid removido - será implementado futuramente se necessário

  // Loading state
  if (expensesLoading || categoriesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando despesas...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (expensesError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro ao carregar despesas</p>
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
              Despesas
            </h1>
            <p className={cn(
              "text-muted-foreground", // Light mode
              "dark:text-spotify-light-gray", // Dark mode
              "spotify:text-spotify-light-gray" // Spotify mode
            )}>
              Gerencie suas despesas e pagamentos
            </p>
          </div>
          <ExpenseForm
            onSave={handleCreateExpense}
            trigger={
              <Button disabled={createExpenseMutation.isPending}>
                {createExpenseMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Nova Despesa
              </Button>
            }
          />
        </div>

        {/* Resumo Mensal - Design Melhorado */}
        <Card className="spotify-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                Resumo do Mês
              </CardTitle>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {monthlyStats.totalExpenses} despesa{monthlyStats.totalExpenses !== 1 ? 's' : ''}
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
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Pago</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyStats.totalPaid)}</div>
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
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filtros na ordem solicitada */}
              <div className="flex gap-1.5">
                {/* 1. Filtro por Mês */}
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Este mês</SelectItem>
                    <SelectItem value="next_month">Mês que vem</SelectItem>
                    <SelectItem value="last_month">Mês anterior</SelectItem>
                    <SelectItem value="current_year">Este ano</SelectItem>
                    <SelectItem value="overdue">Em atraso</SelectItem>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                  </SelectContent>
                </Select>

                {/* 2. Filtro por Categoria */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[110px] h-8 text-xs">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 3. Filtro por Status */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Pesquisa integrada e sutil */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Buscar despesas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8 h-8 text-xs w-48 border-gray-200 focus:w-64 transition-all duration-200"
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

              {/* Botão para resetar filtros (só quando filtros não-padrão estiverem ativos) */}
              {(selectedCategory !== "" || selectedStatus !== "" || selectedPeriod !== "current_month" || searchTerm !== "") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedStatus("");
                    setSelectedPeriod("current_month");
                    setSearchTerm("");
                  }}
                  className="text-xs h-8 px-2 text-gray-500 hover:text-gray-700"
                >
                  Resetar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categorias</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedExpenses.map((expense) => {
                  const status = calculateExpenseStatus(expense);
                  const dueDate = new Date(expense.dueDate);
                  const now = new Date();
                  const isOverdue = dueDate < now && !status.isFullyPaid;
                  
                  return (
                    <TableRow 
                      key={expense.id}
                      className={isOverdue ? "bg-red-50 border-l-4 border-l-red-500" : ""}
                    >
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(expense.categories || []).map((catId: string) => {
                            const category = categories.find(c => c.id.toString() === catId);
                            return (
                              <Badge key={catId} variant="outline" className="text-xs">
                                {category?.name || catId}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(expense.dueDate)}</span>
                          {(() => {
                            const dueDate = new Date(expense.dueDate);
                            const now = new Date();
                            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            
                            if (diffDays < 0 && !status.isFullyPaid) {
                              return <span className="text-xs text-red-600 dark:text-red-400 font-medium">{Math.abs(diffDays)} dia{Math.abs(diffDays) !== 1 ? 's' : ''} em atraso</span>;
                            } else if (diffDays <= 7 && diffDays >= 0 && !status.isFullyPaid) {
                              return <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Vence em {diffDays} dia{diffDays !== 1 ? 's' : ''}</span>;
                            }
                            return null;
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={status.isFullyPaid ? "default" : "secondary"}
                          className={status.isFullyPaid ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}
                        >
                          {status.isFullyPaid ? "Pago" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${status.isFullyPaid ? 'bg-green-600 dark:bg-green-500' : 'bg-blue-600 dark:bg-blue-500'}`}
                              style={{ width: `${Math.min(status.progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {Math.round(status.progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(expense.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedExpense(expense)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" title="Mais ações">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!status.isFullyPaid && (
                                <DropdownMenuItem 
                                  onClick={() => handleMarkAsPaid(expense)}
                                  disabled={markExpenseAsPaidMutation.isPending || payRecurringExpenseMutation.isPending}
                                >
                                  {(markExpenseAsPaidMutation.isPending || payRecurringExpenseMutation.isPending) ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                  )}
                                  Marcar como Pago
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteExpense(expense)}
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
          {filteredAndSortedExpenses.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm || selectedCategory !== "" || selectedStatus !== "" || selectedPeriod !== "current_month" 
                ? "Nenhuma despesa encontrada com os filtros aplicados" 
                : "Nenhuma despesa cadastrada"}
            </div>
          )}
          </CardContent>
        </Card>


      </div>

      {/* Modal de Detalhes da Despesa */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className={cn(
                "text-xl font-semibold",
                "spotify-text-gradient", // Light mode
                "dark:text-white", // Dark mode
                "spotify:text-white" // Spotify mode
              )}>
                Detalhes da Despesa
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedExpense(null)}
                className="spotify-hover"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações da Despesa */}
                <Card className="spotify-hover">
                  <CardHeader>
                    <CardTitle>Informações da Despesa</CardTitle>
                  </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Descrição:</span>
                    <p>{selectedExpense.description}</p>
                  </div>
                  <div>
                    <span className="font-medium">Valor:</span>
                    <p>{formatCurrency(selectedExpense.amount)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Data de Vencimento:</span>
                    <p>{formatDate(selectedExpense.dueDate)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Categorias:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedExpense.categories || []).map((catId: string) => {
                        const category = categories.find(c => c.id.toString() === catId);
                        return (
                          <Badge key={catId} variant="outline" className="text-xs">
                            {category?.name || catId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  {selectedExpense.notes && (
                    <div>
                      <span className="font-medium">Observações:</span>
                      <p>{selectedExpense.notes}</p>
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
                    const status = calculateExpenseStatus(selectedExpense);
                    return (
                      <>
                        <div>
                          <span className="font-medium">Valor Total:</span>
                          <p>{formatCurrency(selectedExpense.amount)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Valor Pago:</span>
                          <p className="text-green-600 dark:text-green-400 font-semibold">{formatCurrency(status.totalPaid)}</p>
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
                                className={`h-2 rounded-full transition-all duration-300 ${status.isFullyPaid ? 'bg-green-600 dark:bg-green-500' : 'bg-blue-600 dark:bg-blue-500'}`}
                                style={{ width: `${Math.min(status.progress, 100)}%` }}
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
                            className={status.isFullyPaid ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}
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

              {/* Ações */}
              <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedExpense(null)}>
                Fechar
              </Button>
              {!calculateExpenseStatus(selectedExpense).isFullyPaid && (
                <Button 
                  onClick={() => handleMarkAsPaid(selectedExpense)}
                  disabled={markExpenseAsPaidMutation.isPending || payRecurringExpenseMutation.isPending}
                >
                  {(markExpenseAsPaidMutation.isPending || payRecurringExpenseMutation.isPending) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Marcando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Pago
                    </>
                  )}
                </Button>
              )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 border shadow-xl">
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
                Tem certeza que deseja excluir a despesa <strong>"{deletingExpense.description}"</strong>?
                <br />
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDeletingExpense(null)}
                  disabled={deleteExpenseMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteExpense}
                  disabled={deleteExpenseMutation.isPending}
                >
                  {deleteExpenseMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
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
