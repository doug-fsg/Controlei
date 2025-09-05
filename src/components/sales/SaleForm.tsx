"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import PaymentManager from "./PaymentManager";
import ClientForm from "@/components/clients/ClientForm";
import { CreateSaleData, CreateSalePaymentData, Client } from "@/types";
import { useClients, useCreateClient } from "@/hooks/useClients";

interface SaleFormProps {
  onSave: (data: CreateSaleData) => void;
  trigger: React.ReactNode;
}

export default function SaleForm({ onSave, trigger }: SaleFormProps) {
  // Hooks da API
  const { data: clients = [] } = useClients();
  const createClientMutation = useCreateClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    totalAmount: "",
    saleDate: "",
    notes: "",
  });

  const [advances, setAdvances] = useState<CreateSalePaymentData[]>([]);
  const [installmentConfig, setInstallmentConfig] = useState<CreateSaleData['installments']>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const saleData: CreateSaleData = {
      clientId: formData.clientId,
      totalAmount: parseFloat(formData.totalAmount),
      saleDate: new Date(formData.saleDate),
      notes: formData.notes || undefined,
      advances,
      installments: installmentConfig || undefined,
    };

    onSave(saleData);
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form
    setFormData({
      clientId: "",
      totalAmount: "",
      saleDate: "",
      notes: "",
    });
    setAdvances([]);
    setInstallmentConfig(undefined);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalAmount = parseFloat(formData.totalAmount) || 0;

  const handleInstallmentConfigChange = (config: {
    remainingAmount: number;
    numberOfInstallments: number;
    startDate: Date;
  } | null | undefined) => {
    setInstallmentConfig(config || undefined);
  };

  const handleCreateClient = async (clientData: Partial<Client>) => {
    try {
      const newClient = await createClientMutation.mutateAsync({
        name: clientData.name!,
        email: clientData.email || undefined,
        phone: clientData.phone || undefined,
        document: clientData.document || undefined,
        address: clientData.address || undefined,
        notes: clientData.notes || undefined,
      });
      
      // Selecionar automaticamente o novo cliente
      setFormData(prev => ({ ...prev, clientId: newClient.id }));
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      alert('Erro ao criar cliente. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos da Venda */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                      {formData.clientId
                        ? clients.find((client) => client.id === formData.clientId)?.name
                        : "Selecione um cliente"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Pesquisar cliente..." />
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => {
                              handleChange("clientId", client.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.clientId === client.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {client.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                </div>
                <ClientForm
                  onSave={handleCreateClient}
                  trigger={
                    <Button type="button" variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Valor Total *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.totalAmount}
                onChange={(e) => handleChange("totalAmount", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleDate">Data da Venda *</Label>
              <Input
                id="saleDate"
                type="date"
                value={formData.saleDate}
                onChange={(e) => handleChange("saleDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre a venda..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Gerenciador de Pagamentos */}
          {totalAmount > 0 && (
            <PaymentManager
              totalAmount={totalAmount}
              advances={advances}
              onAdvancesChange={setAdvances}
              installmentConfig={installmentConfig}
              onInstallmentConfigChange={handleInstallmentConfigChange}
            />
          )}

          {/* Ações */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={!formData.clientId || !formData.totalAmount || !formData.saleDate}
            >
              Criar Venda
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
