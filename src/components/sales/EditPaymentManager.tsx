"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Trash2, AlertTriangle, Info } from "lucide-react";
import { SalePayment } from "@/types";

interface EditPaymentManagerProps {
  totalAmount: number;
  existingPayments: SalePayment[];
  onPaymentsChange: (advances: Array<{
    id?: number;
    amount: number;
    dueDate: string;
  }>, installments: {
    remainingAmount: number;
    numberOfInstallments: number;
    startDate: string;
  } | null) => void;
}

export default function EditPaymentManager({
  totalAmount,
  existingPayments,
  onPaymentsChange,
}: EditPaymentManagerProps) {
  const [advances, setAdvances] = useState<Array<{
    id?: number;
    amount: number;
    dueDate: string;
  }>>([]);
  
  const [installmentConfig, setInstallmentConfig] = useState<{
    remainingAmount: number;
    numberOfInstallments: number;
    startDate: string;
  } | null>(null);

  const [newAdvance, setNewAdvance] = useState({
    amount: "",
    dueDate: "",
  });

  const [installmentForm, setInstallmentForm] = useState({
    numberOfInstallments: "",
    startDate: "",
  });

  // Separar pagamentos existentes
  const paidPayments = existingPayments.filter(p => p.status === 'PAID');
  const pendingPayments = existingPayments.filter(p => p.status === 'PENDING');
  const paidAdvances = paidPayments.filter(p => p.type === 'ADVANCE');
  const paidInstallments = paidPayments.filter(p => p.type === 'INSTALLMENT');

  // Inicializar dados baseados nos pagamentos existentes
  useEffect(() => {
    // Carregar TODAS as entradas (pendentes e pagas)
    const allAdvances = existingPayments
      .filter(p => p.type === 'ADVANCE')
      .map(p => ({
        id: p.id,
        amount: p.amount,
        dueDate: new Date(p.dueDate).toISOString().split('T')[0],
      }));
    setAdvances(allAdvances);

    // Carregar configuração de parcelas (todas)
    const allInstallments = existingPayments.filter(p => p.type === 'INSTALLMENT');
    if (allInstallments.length > 0) {
      const firstInstallment = allInstallments[0];
      const remainingAmount = allInstallments.reduce((sum, p) => sum + p.amount, 0);
      
      setInstallmentConfig({
        remainingAmount,
        numberOfInstallments: firstInstallment.totalInstallments || allInstallments.length,
        startDate: new Date(firstInstallment.dueDate).toISOString().split('T')[0],
      });
      
      setInstallmentForm({
        numberOfInstallments: (firstInstallment.totalInstallments || allInstallments.length).toString(),
        startDate: new Date(firstInstallment.dueDate).toISOString().split('T')[0],
      });
    }
  }, [existingPayments]);

  // Cálculos
  const totalAdvances = advances.reduce((sum, advance) => sum + advance.amount, 0);
  const remainingAmount = totalAmount - totalAdvances;
  const installmentAmount = installmentConfig 
    ? Math.ceil((remainingAmount / installmentConfig.numberOfInstallments) * 100) / 100
    : 0;

  // Notificar mudanças
  useEffect(() => {
    onPaymentsChange(advances, installmentConfig);
  }, [advances, installmentConfig]);

  // Formatadores
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

  // Manipuladores de entrada avulsa
  const addAdvance = () => {
    if (newAdvance.amount && newAdvance.dueDate) {
      const amount = parseFloat(newAdvance.amount);
      if (amount > 0 && amount <= remainingAmount) {
        const advance = {
          amount,
          dueDate: newAdvance.dueDate,
        };
        setAdvances([...advances, advance]);
        setNewAdvance({ amount: "", dueDate: "" });
        
        // Recalcula parcelas automaticamente se existirem
        if (installmentConfig) {
          handleInstallmentConfig(installmentConfig.numberOfInstallments);
        }
      }
    }
  };

  const removeAdvance = (index: number) => {
    const newAdvances = advances.filter((_, i) => i !== index);
    setAdvances(newAdvances);
    
    // Recalcula parcelas automaticamente se existirem
    if (installmentConfig) {
      handleInstallmentConfig(installmentConfig.numberOfInstallments);
    }
  };

  // Manipulador de parcelas
  const handleInstallmentConfig = (numberOfInstallments: number) => {
    if (numberOfInstallments > 0 && remainingAmount > 0) {
      const startDate = installmentForm.startDate || new Date().toISOString().split('T')[0];
      const config = {
        remainingAmount,
        numberOfInstallments,
        startDate,
      };
      setInstallmentConfig(config);
      setInstallmentForm({
        numberOfInstallments: numberOfInstallments.toString(),
        startDate,
      });
    }
  };

  const clearInstallmentConfig = () => {
    setInstallmentConfig(null);
    setInstallmentForm({ numberOfInstallments: "", startDate: "" });
  };

  // Gera preview das parcelas
  const generateInstallmentPreview = () => {
    if (!installmentConfig) return [];

    const { startDate, numberOfInstallments } = installmentConfig;
    const installments = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < numberOfInstallments; i++) {
      installments.push({
        number: i + 1,
        amount: installmentAmount,
        dueDate: new Date(currentDate),
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return installments;
  };

  return (
    <div className="space-y-6">
      {/* Aviso Principal */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <strong>Atenção:</strong> Ao salvar, todas as parcelas existentes serão substituídas pelas novas configurações.
          </div>
        </div>
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <Label>Valor Total</Label>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          </div>
          <div>
            <Label>Total de Entradas</Label>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAdvances)}
            </div>
          </div>
          <div>
            <Label>Saldo Restante</Label>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(remainingAmount)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagamentos Já Realizados */}
      {paidPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Pagamentos Já Realizados (Editáveis com Aviso)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {payment.type === 'ADVANCE' ? 'Entrada' : 
                         `Parcela ${payment.installmentNumber}/${payment.totalInstallments}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatDate(payment.dueDate)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Entradas Avulsas */}
      <Card>
        <CardHeader>
          <CardTitle>Entradas Avulsas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="advanceAmount">Valor da Entrada</Label>
              <Input
                id="advanceAmount"
                type="number"
                step="0.01"
                min="0"
                max={remainingAmount}
                placeholder="0,00"
                value={newAdvance.amount}
                onChange={(e) => setNewAdvance(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="advanceDate">Data de Vencimento</Label>
              <Input
                id="advanceDate"
                type="date"
                value={newAdvance.dueDate}
                onChange={(e) => setNewAdvance(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addAdvance}
                disabled={!newAdvance.amount || !newAdvance.dueDate || parseFloat(newAdvance.amount) > remainingAmount}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {advances.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances.map((advance, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(advance.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(advance.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAdvance(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Parcelamento do Saldo */}
      {remainingAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parcelamento do Saldo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  placeholder="Número de parcelas"
                  value={installmentForm.numberOfInstallments}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setInstallmentForm(prev => ({ ...prev, numberOfInstallments: e.target.value }));
                    if (value > 0) {
                      handleInstallmentConfig(value);
                    }
                  }}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="startDate">Data da Primeira Parcela</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={installmentForm.startDate}
                  onChange={(e) => {
                    setInstallmentForm(prev => ({ ...prev, startDate: e.target.value }));
                    if (installmentForm.numberOfInstallments) {
                      handleInstallmentConfig(parseInt(installmentForm.numberOfInstallments));
                    }
                  }}
                />
              </div>
            </div>

            {installmentConfig && (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    {installmentConfig.numberOfInstallments}x de {formatCurrency(installmentAmount)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearInstallmentConfig}
                  >
                    Limpar
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generateInstallmentPreview().map((installment) => (
                      <TableRow key={installment.number}>
                        <TableCell>{installment.number}ª Parcela</TableCell>
                        <TableCell>{formatDate(installment.dueDate)}</TableCell>
                        <TableCell>{formatCurrency(installment.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
