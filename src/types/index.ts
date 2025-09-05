// Tipos comuns
export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cliente
export interface Client extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  notes?: string;
  userId: number;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone: string;
  document: string;
  notes?: string;
}

// Venda
export interface Sale extends BaseEntity {
  clientId: number;
  client?: Client;
  totalAmount: number;
  saleDate: Date;
  notes?: string;
  payments: SalePayment[];
  userId: number;
}

export interface CreateSaleData {
  clientId: number;
  totalAmount: number;
  saleDate: Date;
  notes?: string;
  advances: CreateSalePaymentData[];
  installments?: {
    remainingAmount: number;
    numberOfInstallments: number;
    startDate: Date;
  };
}

// Pagamento
export type PaymentType = 'ADVANCE' | 'INSTALLMENT';
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'COMPLETED' | 'OVERDUE';

export interface Payment extends BaseEntity {
  type: PaymentType;
  amount: number;
  dueDate: Date;
  paidAmount: number;
  paidDate?: Date;
  status: PaymentStatus;
}

export interface SalePayment extends BaseEntity {
  saleId: number;
  type: PaymentType;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
  paidDate?: Date;
  installmentNumber?: number;
  totalInstallments?: number;
}

export interface CreateSalePaymentData {
  type: PaymentType;
  amount: number;
  dueDate: Date;
}

// Despesa
export interface ExpenseCategory extends BaseEntity {
  name: string;
  description?: string;
  color?: string;
}

export interface CreateExpenseCategoryData {
  name: string;
  description?: string;
  color?: string;
}

export interface Expense extends BaseEntity {
  description: string;
  amount: number;
  dueDate: Date;
  paidAmount: number;
  paidDate?: Date;
  status: PaymentStatus;
  categories: string[]; // IDs das categorias
  notes?: string;
  installments?: number;
  // Campos de recorrência
  isRecurring?: boolean;
  recurringFrequency?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurringDayOfMonth?: number;
  recurringEndDate?: Date;
  parentExpenseId?: number;
}

export interface CreateExpenseData {
  description: string;
  amount: number;
  dueDate: Date;
  categories: string[]; // IDs das categorias
  notes?: string;
  installments?: {
    numberOfInstallments: number;
    startDate: Date;
    dayOfMonth?: number;
  };
  recurring?: {
    frequency: "monthly" | "weekly" | "yearly";
    dayOfMonth?: number;
    endDate?: Date;
  };
}

// Fluxo de Caixa
export interface CashFlowItem extends BaseEntity {
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
  clientOrSupplier: string;
}