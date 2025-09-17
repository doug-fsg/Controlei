"use client";

import React, { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { Expense, ExpenseCategory } from "@/types";
import { useCategories } from "@/hooks/useCategories";
import CategoryManager from "./CategoryManager";

interface EditExpenseFormProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    description: string;
    amount: number;
    dueDate: string;
    categoryId: number;
    notes?: string;
  }) => void;
  isLoading?: boolean;
}

export default function EditExpenseForm({ 
  expense, 
  open, 
  onOpenChange, 
  onSave,
  isLoading = false
}: EditExpenseFormProps) {
  // Hook para categorias
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    dueDate: "",
    categoryId: "",
    notes: "",
  });

  // Preencher formulário quando despesa mudar
  useEffect(() => {
    if (expense) {
      const dueDate = new Date(expense.dueDate);
      const formattedDate = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      setFormData({
        description: expense.description || "",
        amount: expense.amount?.toString() || "",
        dueDate: formattedDate,
        categoryId: expense.categories?.[0] || "",
        notes: expense.notes || "",
      });
    }
  }, [expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.dueDate || !formData.categoryId) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    onSave({
      description: formData.description,
      amount: parseFloat(formData.amount),
      dueDate: new Date(formData.dueDate).toISOString(),
      categoryId: parseInt(formData.categoryId),
      notes: formData.notes || undefined,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Despesa */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição *</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Valor *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Data de Vencimento *</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleChange("categoryId", value)}
                  disabled={isLoading}
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
                    <Button type="button" variant="outline" size="icon" title="Gerenciar Categorias" disabled={isLoading}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Observações</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Observações adicionais..."
              disabled={isLoading}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
