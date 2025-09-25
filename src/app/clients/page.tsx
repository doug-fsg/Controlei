"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Edit, Trash2, Loader2, AlertCircle, Users, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ClientForm from "@/components/clients/ClientForm";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { useSales } from "@/hooks/useSales";
import { Client } from "@/types";

type SortField = 'name' | 'email' | 'phone' | 'document' | 'createdAt';
type SortDirection = 'asc' | 'desc' | null;

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Estados para filtros por data de criação
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  
  // Estado para filtro de clientes ativos
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Hooks da API
  const { data: clients = [], isLoading, error } = useClients();
  const { data: sales = [] } = useSales();
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  // Função para verificar se um cliente está ativo (tem pagamentos pendentes)
  const isClientActive = (clientId: number) => {
    const clientSales = sales.filter(sale => sale.clientId === clientId);
    
    // Verificar se alguma venda tem pagamentos pendentes
    return clientSales.some(sale => 
      sale.payments.some(payment => payment.status === 'PENDING')
    );
  };

  // Função para lidar com mudanças no filtro de período
  const handlePeriodChange = (period: string) => {
    setDateFilter(period);
    // Limpar datas personalizadas quando mudar de período
    if (period !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const filteredClients = clients.filter((client: Client) => {
    // Filtro de busca por texto
    const matchesSearch = searchTerm === "" || 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.document?.includes(searchTerm);
    
    // Filtro por data de criação
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const clientDate = new Date(client.createdAt);
      const now = new Date();
      
      if (dateFilter === 'current_month') {
        matchesDate = clientDate.getMonth() === now.getMonth() && 
                    clientDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'custom') {
        if (customStartDate && customEndDate) {
          // Criar datas locais para evitar problemas de timezone
          const [startYear, startMonth, startDay] = customStartDate.split('-').map(Number);
          const [endYear, endMonth, endDay] = customEndDate.split('-').map(Number);
          
          const startDate = new Date(startYear, startMonth - 1, startDay); // mês é 0-indexado
          const endDate = new Date(endYear, endMonth - 1, endDay);
          const clientDateOnly = new Date(clientDate.getFullYear(), clientDate.getMonth(), clientDate.getDate());
          
          matchesDate = clientDateOnly >= startDate && clientDateOnly <= endDate;
        } else {
          matchesDate = false; // Se não há datas definidas, não mostrar nada
        }
      } else {
        const diffTime = Math.abs(now.getTime() - clientDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (dateFilter === 'today') matchesDate = diffDays === 0;
        else if (dateFilter === 'week') matchesDate = diffDays <= 7;
        else if (dateFilter === 'month') matchesDate = diffDays <= 30;
      }
    }
    
    // Filtro por status ativo
    let matchesActive = true;
    if (activeFilter !== 'all') {
      const isActive = isClientActive(client.id);
      if (activeFilter === 'active') {
        matchesActive = isActive;
      } else if (activeFilter === 'inactive') {
        matchesActive = !isActive;
      }
    }
    
    return matchesSearch && matchesDate && matchesActive;
  });

  // Função para ordenar os clientes
  const sortedClients = [...filteredClients].sort((a: Client, b: Client) => {
    if (!sortDirection) return 0;
    
    let aValue: string | number;
    let bValue: string | number;
    
    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'email':
        aValue = (a.email || '').toLowerCase();
        bValue = (b.email || '').toLowerCase();
        break;
      case 'phone':
        aValue = (a.phone || '').toLowerCase();
        bValue = (b.phone || '').toLowerCase();
        break;
      case 'document':
        aValue = (a.document || '').toLowerCase();
        bValue = (b.document || '').toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Função para lidar com clique no cabeçalho
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Se clicou no mesmo campo, alterna a direção
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      // Se clicou em um campo diferente, define como ascendente
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para obter o ícone de ordenação
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    
    switch (sortDirection) {
      case 'asc':
        return <ArrowUp className="h-4 w-4 text-gray-600 dark:text-gray-300" />;
      case 'desc':
        return <ArrowDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleCreateClient = async (data: Partial<Client>) => {
    try {
      await createClientMutation.mutateAsync({
        name: data.name!,
        email: data.email || '',
        phone: data.phone || '',
        document: data.document || '',
        address: data.address || '',
        notes: data.notes || undefined,
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      alert('Erro ao criar cliente. Tente novamente.');
    }
  };

  const handleUpdateClient = async (data: Partial<Client>) => {
    if (!editingClient) return;
    
    try {
      await updateClientMutation.mutateAsync({
        id: editingClient.id,
        data: {
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          document: data.document || undefined,
          address: data.address || undefined,
          notes: data.notes || undefined,
        },
      });
      setEditingClient(null);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente. Tente novamente.');
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    try {
      await deleteClientMutation.mutateAsync(clientId);
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      alert('Erro ao deletar cliente. Tente novamente.');
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Erro ao carregar clientes. Tente recarregar a página.</p>
            </div>
          </Card>
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
              Clientes
            </h1>
            <p className={cn(
              "text-muted-foreground", // Light mode
              "dark:text-spotify-light-gray", // Dark mode
              "spotify:text-spotify-light-gray" // Spotify mode
            )}>
              Gerencie seus clientes
            </p>
          </div>
          <ClientForm
            onSave={handleCreateClient}
            trigger={
              <Button disabled={createClientMutation.isPending}>
                {createClientMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Novo Cliente
              </Button>
            }
          />
        </div>



        <Card className="spotify-hover">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-semibold">Lista de Clientes</CardTitle>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Filtros - estilo expenses */}
            <div className="flex items-center gap-3 mb-4">
              {/* Busca integrada e sutil */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou documento..."
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

              {/* Filtro por data de criação */}
              <Select value={dateFilter} onValueChange={handlePeriodChange}>
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="current_month">Este mês</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por status ativo */}
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Campos de data personalizada */}
              {dateFilter === "custom" && (
                <div className="flex gap-1.5 items-center">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-8 text-xs px-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Data inicial"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">até</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-8 text-xs px-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Data final"
                  />
                </div>
              )}

              {/* Botão para resetar filtros */}
              {(dateFilter !== "all" || searchTerm !== "" || activeFilter !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setDateFilter("all");
                    setSearchTerm("");
                    setActiveFilter("all");
                    setCustomStartDate("");
                    setCustomEndDate("");
                  }}
                  className="text-xs h-8 px-2 text-gray-500 hover:text-gray-700"
                >
                  Resetar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className={cn(
                  "h-6 w-6 animate-spin",
                  "text-spotify-green-light", // Light mode
                  "dark:text-spotify-green", // Dark mode
                  "spotify:text-spotify-green" // Spotify mode
                )} />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Carregando clientes...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Nome
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 select-none"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        Email
                        {getSortIcon('email')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 select-none"
                      onClick={() => handleSort('phone')}
                    >
                      <div className="flex items-center gap-2">
                        Telefone
                        {getSortIcon('phone')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 select-none"
                      onClick={() => handleSort('document')}
                    >
                      <div className="flex items-center gap-2">
                        Documento
                        {getSortIcon('document')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 select-none"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        Criado em
                        {getSortIcon('createdAt')}
                      </div>
                    </TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClients.map((client: Client) => {
                    const isActive = isClientActive(client.id);
                    return (
                      <TableRow key={client.id} className="spotify-hover">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Circle 
                              className={cn(
                                "h-2 w-2",
                                isActive 
                                  ? "text-green-500 fill-green-500" 
                                  : "text-gray-300 fill-gray-300"
                              )} 
                            />
                            {client.name}
                          </div>
                        </TableCell>
                      <TableCell>{client.email || '-'}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell>{client.document || '-'}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(client.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <ClientForm
                            client={client}
                            onSave={handleUpdateClient}
                            trigger={
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={updateClientMutation.isPending}
                                onClick={() => setEditingClient(client)}
                                className="spotify-hover"
                              >
                                {updateClientMutation.isPending && editingClient?.id === client.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Edit className="h-4 w-4" />
                                )}
                              </Button>
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClient(client.id)}
                            disabled={deleteClientMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 spotify-hover"
                          >
                            {deleteClientMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {!isLoading && sortedClients.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm || dateFilter !== "all" || activeFilter !== "all" ? "Nenhum cliente encontrado com os filtros aplicados" : "Nenhum cliente cadastrado"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}