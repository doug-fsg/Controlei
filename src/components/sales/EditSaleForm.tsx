"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, ChevronsUpDown, AlertTriangle, CheckCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sale, Client } from "@/types";
import { useClients } from "@/hooks/useClients";

interface EditSaleFormProps {
  sale: Sale | null;
  onSave: (data: { id: string; data: any }) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function EditSaleForm({ sale, onSave, onClose, isLoading = false }: EditSaleFormProps) {
  const { data: clients = [] } = useClients();
  const [formData, setFormData] = useState({
    clientId: "",
    totalAmount: "",
    saleDate: "",
    notes: "",
  });

  // Estados para controle de alterações perigosas
  const [showWarnings, setShowWarnings] = useState(false);
  const [hasPayments, setHasPayments] = useState(false);
  const [hasPaidPayments, setHasPaidPayments] = useState(false);
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);

  // Inicializar formulário quando sale muda
  useEffect(() => {
    if (sale) {
      setFormData({
        clientId: sale.clientId?.toString() || "",
        totalAmount: sale.totalAmount.toString(),
        saleDate: new Date(sale.saleDate).toISOString().split('T')[0],
        notes: sale.notes || "",
      });

      // Analisar pagamentos existentes
      const payments = sale.payments || [];
      const paidPayments = payments.filter(p => p.status === 'PAID');
      
      setHasPayments(payments.length > 0);
      setHasPaidPayments(paidPayments.length > 0);
    }
  }, [sale]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;

    const newTotalAmount = parseFloat(formData.totalAmount);
    const originalTotalAmount = sale.totalAmount;

    // Verificar se há mudanças que podem afetar pagamentos
    if (hasPayments && newTotalAmount !== originalTotalAmount) {
      if (!showWarnings) {
        setShowWarnings(true);
        return;
      }
    }

    const updateData = {
      id: sale.id.toString(),
      data: {
        clientId: parseInt(formData.clientId),
        totalAmount: newTotalAmount,
        saleDate: new Date(formData.saleDate).toISOString(),
        notes: formData.notes || undefined,
      },
    };

    onSave(updateData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Reset warnings quando o usuário faz mudanças
    if (showWarnings) {
      setShowWarnings(false);
    }
  };

  // Validações em tempo real
  const getValidationStatus = () => {
    const newAmount = parseFloat(formData.totalAmount) || 0;
    const hasChanges = (
      formData.clientId !== sale?.clientId?.toString() ||
      newAmount !== originalTotalAmount ||
      formData.saleDate !== new Date(sale?.saleDate || '').toISOString().split('T')[0] ||
      formData.notes !== (sale?.notes || '')
    );

    const isValid = formData.clientId && formData.totalAmount && formData.saleDate;
    
    return { hasChanges, isValid, newAmount };
  };

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

  const calculatePaymentsSummary = () => {
    if (!sale?.payments) return { totalPaid: 0, totalPending: 0, pendingCount: 0, paidCount: 0 };

    const payments = sale.payments;
    const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
    const paidCount = payments.filter(p => p.status === 'PAID').length;
    const pendingCount = payments.filter(p => p.status === 'PENDING').length;

    return { totalPaid, totalPending, pendingCount, paidCount };
  };

  if (!sale) return null;

  const paymentsSummary = calculatePaymentsSummary();
  const newTotalAmount = parseFloat(formData.totalAmount) || 0;
  const originalTotalAmount = sale.totalAmount;
  const amountDifference = newTotalAmount - originalTotalAmount;
  const validationStatus = getValidationStatus();

  return (
    <Dialog open={!!sale} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Editar Venda
              {hasPayments && (
                <Badge variant="outline" className="text-xs">
                  {sale.payments?.length} pagamento{(sale.payments?.length || 0) !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {hasPayments && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedMode(!showAdvancedMode)}
                className="text-xs"
              >
                {showAdvancedMode ? 'Modo Simples' : 'Modo Avançado'}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Venda Original */}
          <Card className="bg-gray-50 dark:bg-gray-800/50">
            <CardHeader>
              <CardTitle className="text-sm">Informações Atuais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Cliente:</span> {sale.client?.name}
              </div>
              <div>
                <span className="font-medium">Valor:</span> {formatCurrency(sale.totalAmount)}
              </div>
              <div>
                <span className="font-medium">Data:</span> {formatDate(sale.saleDate)}
              </div>
              <div>
                <span className="font-medium">Status:</span>
                {!hasPayments ? (
                  <Badge className="ml-2 bg-green-600 text-white">Venda à Vista</Badge>
                ) : (
                  <Badge className="ml-2" variant="outline">
                    {paymentsSummary.paidCount} pago{paymentsSummary.paidCount !== 1 ? 's' : ''}, {paymentsSummary.pendingCount} pendente{paymentsSummary.pendingCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Avisos sobre Alterações */}
          {showWarnings && hasPayments && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">
                      Atenção: Alteração no Valor Total
                    </h4>
                    <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                      <p>Esta venda possui {sale.payments?.length} pagamento{(sale.payments?.length || 0) !== 1 ? 's' : ''} associado{(sale.payments?.length || 0) !== 1 ? 's' : ''}.</p>
                      <p>
                        <strong>Diferença:</strong> {amountDifference > 0 ? '+' : ''}{formatCurrency(Math.abs(amountDifference))}
                      </p>
                      <p>
                        <strong>Novo total:</strong> {formatCurrency(newTotalAmount)}
                      </p>
                      {hasPaidPayments && (
                        <p className="font-medium text-orange-800 dark:text-orange-200">
                          ⚠️ Alguns pagamentos já foram recebidos. Verifique se a alteração está correta.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulário de Edição */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {formData.clientId
                      ? clients.find((client) => client.id.toString() === formData.clientId)?.name
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
                            handleChange("clientId", client.id.toString());
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.clientId === client.id.toString() ? "opacity-100" : "opacity-0"
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
                className={cn(
                  hasPayments && parseFloat(formData.totalAmount) !== originalTotalAmount
                    ? "border-orange-300 focus:border-orange-400"
                    : ""
                )}
              />
              {hasPayments && parseFloat(formData.totalAmount) !== originalTotalAmount && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Alteração de {formatCurrency(originalTotalAmount)} para {formatCurrency(parseFloat(formData.totalAmount) || 0)}
                </p>
              )}
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

          {/* Resumo dos Pagamentos Existentes */}
          {hasPayments && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Pagamentos Existentes
                  <Badge variant="outline" className="text-xs">
                    {paymentsSummary.paidCount} pago{paymentsSummary.paidCount !== 1 ? 's' : ''}, {paymentsSummary.pendingCount} pendente{paymentsSummary.pendingCount !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Pago</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(paymentsSummary.totalPaid)}
                    </div>
                  </div>
                  <div className="text-center border-x border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Pendente</div>
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(paymentsSummary.totalPending)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total dos Pagamentos</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(paymentsSummary.totalPaid + paymentsSummary.totalPending)}
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.payments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {payment.type === 'ADVANCE' ? 'Entrada' : 
                             `Parcela ${payment.installmentNumber}/${payment.totalInstallments}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={payment.status === 'PAID' ? "default" : "secondary"}
                            className={payment.status === 'PAID' ? "bg-green-600 text-white" : ""}
                          >
                            {payment.status === 'PAID' ? 'Pago' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Alertas sobre inconsistências */}
                {newTotalAmount !== originalTotalAmount && (
                  <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Atenção: Valor total alterado
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                          O valor total da venda será alterado de {formatCurrency(originalTotalAmount)} para {formatCurrency(newTotalAmount)}.
                          {hasPaidPayments && " Alguns pagamentos já foram recebidos."}
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                          <strong>Recomendação:</strong> Verifique se esta alteração está correta antes de confirmar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alerta sobre mudança de cliente com pagamentos pagos */}
                {formData.clientId !== sale.clientId?.toString() && hasPaidPayments && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800 dark:text-red-200">
                          ⚠️ Alteração de Cliente com Pagamentos Recebidos
                        </p>
                        <p className="text-red-700 dark:text-red-300 mt-1">
                          Esta venda já possui pagamentos recebidos. Alterar o cliente pode causar problemas contábeis.
                        </p>
                        <p className="text-red-700 dark:text-red-300 mt-1">
                          <strong>Sugestão:</strong> Considere criar uma nova venda para o novo cliente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dicas e Sugestões */}
          {!hasPayments && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Venda à Vista
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Esta venda não possui pagamentos associados. Você pode editar livremente os dados básicos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showAdvancedMode && hasPayments && (
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-800 dark:text-purple-200">
                      Modo Avançado Ativado
                    </h4>
                    <div className="text-sm text-purple-700 dark:text-purple-300 mt-1 space-y-1">
                      <p>• Para alterar valores de pagamentos específicos, use a tela de detalhes da venda</p>
                      <p>• Alterações no valor total podem criar inconsistências</p>
                      <p>• Considere criar uma nova venda se as mudanças forem muito grandes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {hasPayments ? (
                <>
                  💡 Dica: Para editar pagamentos individuais, use a tela de detalhes da venda
                </>
              ) : (
                <>
                  ✅ Venda à vista - edição segura
                </>
              )}
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={!validationStatus.isValid || isLoading || !validationStatus.hasChanges}
                className={cn(
                  showWarnings && hasPayments ? "bg-orange-600 hover:bg-orange-700" : "",
                  !validationStatus.hasChanges && validationStatus.isValid ? "opacity-50" : ""
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : !validationStatus.hasChanges ? (
                  "Nenhuma Alteração"
                ) : showWarnings && hasPayments ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Alteração
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
