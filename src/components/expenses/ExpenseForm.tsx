"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { CreateExpenseData, ExpenseCategory } from "@/types";
import { useCategories } from "@/hooks/useCategories";
import CategoryManager from "./CategoryManager";

interface ExpenseFormProps {
  onSave: (data: CreateExpenseData) => void;
  trigger: React.ReactNode;
}

export default function ExpenseForm({ 
  onSave, 
  trigger
}: ExpenseFormProps) {
  // Hook para categorias
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const [open, setOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<"single" | "installment" | "recurring">("single");
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    dueDate: "",
    categories: [] as string[],
    notes: "",
  });

  const [installmentConfig, setInstallmentConfig] = useState({
    numberOfInstallments: "",
    startDate: "",
    dayOfMonth: "",
  });

  const [recurringConfig, setRecurringConfig] = useState({
    frequency: "monthly", // monthly, weekly, yearly
    dayOfMonth: "",
    startDate: "",
    endDate: "", // opcional
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseExpenseData = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      dueDate: new Date(formData.dueDate),
      categories: formData.categories,
      notes: formData.notes || undefined,
    };

    let expenseData: CreateExpenseData;

    if (expenseType === "installment") {
      // Despesa Parcelada
      expenseData = {
        ...baseExpenseData,
        installments: {
          numberOfInstallments: parseInt(installmentConfig.numberOfInstallments),
          startDate: new Date(formData.dueDate),
          dayOfMonth: installmentConfig.dayOfMonth ? parseInt(installmentConfig.dayOfMonth) : undefined,
        },
      };
    } else if (expenseType === "recurring") {
      // Despesa Fixa/Recorrente
      expenseData = {
        ...baseExpenseData,
        recurring: {
          frequency: recurringConfig.frequency as "monthly" | "weekly" | "yearly",
          dayOfMonth: recurringConfig.dayOfMonth ? parseInt(recurringConfig.dayOfMonth) : undefined,
          endDate: recurringConfig.endDate ? new Date(recurringConfig.endDate) : undefined,
        },
      };
    } else {
      // Despesa Única
      expenseData = baseExpenseData;
    }

    onSave(expenseData);
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form
    setExpenseType("single");
    setFormData({
      description: "",
      amount: "",
      dueDate: "",
      categories: [],
      notes: "",
    });
    setInstallmentConfig({
      numberOfInstallments: "",
      startDate: "",
      dayOfMonth: "",
    });
    setRecurringConfig({
      frequency: "monthly",
      dayOfMonth: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Despesa */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tipo de Despesa</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setExpenseType("single")}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  expenseType === "single" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium">Única</div>
                <div className="text-sm text-muted-foreground">Ex: Pagar lâmpada</div>
              </button>
              <button
                type="button"
                onClick={() => setExpenseType("installment")}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  expenseType === "installment" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium">Parcelada</div>
                <div className="text-sm text-muted-foreground">Ex: Computador 12x</div>
              </button>
              <button
                type="button"
                onClick={() => setExpenseType("recurring")}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  expenseType === "recurring" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium">Fixa</div>
                <div className="text-sm text-muted-foreground">Ex: Salário funcionário</div>
              </button>
            </div>
          </div>

          {/* Dados Básicos da Despesa */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">
                {expenseType === "single" 
                  ? "Data de Vencimento *" 
                  : expenseType === "installment" 
                  ? "Primeira Parcela *" 
                  : "Primeira Cobrança *"}
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.categories[0] || ""}
                  onValueChange={(value) => handleChange("categories", [value])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="" disabled>
                        Carregando categorias...
                      </SelectItem>
                    ) : categoriesError ? (
                      <SelectItem value="" disabled>
                        Erro ao carregar categorias
                      </SelectItem>
                    ) : categories.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhuma categoria encontrada
                      </SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                <CategoryManager
                  trigger={
                    <Button type="button" variant="outline" size="icon" title="Gerenciar Categorias">
                      <Settings className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </div>
          </div>

          {/* Configurações específicas por tipo */}
          {expenseType === "installment" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/25">
              <Label className="text-base font-medium">Configuração do Parcelamento</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Parcelas *</Label>
                  <Input
                    type="number"
                    min="2"
                    max="60"
                    placeholder="Ex: 12"
                    value={installmentConfig.numberOfInstallments}
                    onChange={(e) => setInstallmentConfig(prev => ({
                      ...prev,
                      numberOfInstallments: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dia do Vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 10 (todo dia 10)"
                    value={installmentConfig.dayOfMonth}
                    onChange={(e) => setInstallmentConfig(prev => ({
                      ...prev,
                      dayOfMonth: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se não informado, usará o dia da primeira parcela
                  </p>
                </div>
              </div>
            </div>
          )}

          {expenseType === "recurring" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/25">
              <Label className="text-base font-medium">Configuração da Despesa Fixa</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequência *</Label>
                  <Select
                    value={recurringConfig.frequency}
                    onValueChange={(value) => setRecurringConfig(prev => ({
                      ...prev,
                      frequency: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dia do Vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max={recurringConfig.frequency === "monthly" ? "31" : "7"}
                    placeholder={recurringConfig.frequency === "monthly" ? "Ex: 5 (todo dia 5)" : "Ex: 1 (segunda-feira)"}
                    value={recurringConfig.dayOfMonth}
                    onChange={(e) => setRecurringConfig(prev => ({
                      ...prev,
                      dayOfMonth: e.target.value
                    }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data de Término (opcional)</Label>
                <Input
                  type="date"
                  value={recurringConfig.endDate}
                  onChange={(e) => setRecurringConfig(prev => ({
                    ...prev,
                    endDate: e.target.value
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Se não informado, a despesa será cobrada indefinidamente
                </p>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}