"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, AlertCircle, Save, X, Loader2 } from "lucide-react";
import { ExpenseCategory } from "@/types";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";

interface CategoryManagerProps {
  trigger: React.ReactNode;
}

export default function CategoryManager({ trigger }: CategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Hooks da API
  const { data: categories = [], isLoading } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
      });
      setNewCategoryName("");
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      alert("Erro ao criar categoria. Tente novamente.");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    
    try {
      await updateCategoryMutation.mutateAsync({
        id: editingCategory.id,
        data: { name: newCategoryName.trim() },
      });
      setEditingCategory(null);
      setNewCategoryName("");
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      alert("Erro ao atualizar categoria. Tente novamente.");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      alert("Erro ao excluir categoria. Pode haver despesas vinculadas a ela.");
    }
  };

  const startEditing = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setNewCategoryName("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editingCategory) {
        handleUpdateCategory();
      } else {
        handleCreateCategory();
      }
    } else if (e.key === "Escape") {
      if (editingCategory) {
        cancelEditing();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg">Gerenciar Categorias</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Criar Nova Categoria */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nova Categoria</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={!!editingCategory || createCategoryMutation.isPending}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending || !!editingCategory}
              >
                {createCategoryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Lista de Categorias */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categorias Existentes</Label>
            <div className="border rounded-lg">
              {isLoading ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  <span className="text-sm text-muted-foreground mt-2">Carregando...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Nenhuma categoria cadastrada
                </div>
              ) : (
                <div className="divide-y">
                  {categories.map((category: ExpenseCategory) => (
                    <div key={category.id} className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        {editingCategory?.id === category.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={handleKeyPress}
                              className="h-8 text-sm"
                              size={1}
                            />
                            <Button
                              size="sm"
                              onClick={handleUpdateCategory}
                              disabled={!newCategoryName.trim() || updateCategoryMutation.isPending}
                              className="h-8 px-2"
                            >
                              {updateCategoryMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                              className="h-8 px-2"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{category.name}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                      {editingCategory?.id !== category.id && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(category)}
                            disabled={updateCategoryMutation.isPending || !!editingCategory}
                            title="Editar categoria"
                            className="h-8 w-8"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={deleteCategoryMutation.isPending}
                            title="Excluir categoria"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            {deleteCategoryMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Informações */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Dicas:</p>
              <ul className="space-y-0.5">
                <li>• Clique no ícone de edição para modificar</li>
                <li>• Use Enter para salvar ou Esc para cancelar</li>
                <li>• Não é possível excluir categorias com despesas</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}