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
import { Plus, Search, Edit, Trash2, Loader2, AlertCircle, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ClientForm from "@/components/clients/ClientForm";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { Client } from "@/types";

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Hooks da API
  const { data: clients = [], isLoading, error } = useClients();
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  const filteredClients = clients.filter((client: Client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document?.includes(searchTerm)
  );

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



        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm spotify-card">
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lista de Clientes</h3>
            </div>
            
            {/* Busca integrada e sutil - estilo expenses */}
            <div className="flex items-center gap-3 mb-4">
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
            </div>
          </div>
          <div className="px-4">
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client: Client) => (
                    <TableRow key={client.id} className="spotify-hover">
                      <TableCell className="font-medium">{client.name}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            )}
            {!isLoading && filteredClients.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm ? "Nenhum cliente encontrado com os filtros aplicados" : "Nenhum cliente cadastrado"}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}