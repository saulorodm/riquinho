export type CategoryType = "EXPENSE" | "INCOME" | "INVESTMENT";
export type PaymentMethod =
  | "PIX"
  | "DEBIT_CARD"
  | "CREDIT_CARD_FULL"
  | "CREDIT_CARD_INSTALLMENTS";
export type ExpenseKind = "OPERATIONAL" | "EXTRAORDINARY" | "PATRIMONIAL";
export type InvestmentType =
  | "STOCKS_ETFS"
  | "REITS_FIIS"
  | "FIXED_INCOME"
  | "CASH_RESERVE"
  | "CRYPTO"
  | "OTHER";
export type AssetCategory =
  | "VEHICLE"
  | "RESIDENCE"
  | "INCOME_PROPERTY"
  | "LAND"
  | "BUSINESS_EQUITY"
  | "FGTS"
  | "OTHER";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color?: string | null;
  icon?: string | null;
  budgetCeiling?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialCycle {
  id: string;
  name: string;
  referenceLabel?: string | null;
  startDate: string;
  endDate: string;
}

export interface ExpenseInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  financialCycle?: FinancialCycle | null;
}

export interface Expense {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  expenseKind: ExpenseKind;
  isRecurring?: boolean;
  purchaseDate: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  installmentsCount: number;
  createdAt?: string;
  updatedAt?: string;
  category?: Category | null;
  financialCycle?: FinancialCycle | null;
  installments: ExpenseInstallment[];
}

export interface Income {
  id: string;
  sourceName: string;
  amount: number;
  receivedAt: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  category?: Category | null;
  financialCycle?: FinancialCycle | null;
}

export interface InvestmentSnapshot {
  id: string;
  value: number;
  capturedAt: string;
  createdAt?: string;
}

export interface Investment {
  id: string;
  name: string;
  assetType: InvestmentType;
  amountInvested: number;
  quantity?: number | null;
  currentQuantity?: number | null;
  averageUnitPrice?: number | null;
  currentValue?: number | null;
  netCurrentValue?: number | null;
  investedAt: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  category?: Category | null;
  snapshots: InvestmentSnapshot[];
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  acquisitionValue?: number | null;
  currentValue: number;
  acquiredAt: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoanInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Loan {
  id: string;
  borrowerName: string;
  principalAmount: number;
  installmentAmount: number;
  dueDay: number;
  installmentsCount: number;
  startDate: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  installments: LoanInstallment[];
}

export interface DashboardData {
  cycle: FinancialCycle | null;
  availableCycles: FinancialCycle[];
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    remainingBudget: number;
    totalInvested: number;
    currentPortfolioValue: number;
  };
  cycleSummary: {
    operationalExpenses: number;
    extraordinaryExpenses: number;
    patrimonialExpenses: number;
    operationalBalance: number;
    netCashFlow: number;
  };
  expenseByCategory: Array<{ name: string; value: number }>;
  investmentAllocation: Array<{ name: string; value: number }>;
  monthlyOverview: Array<{ name: string; value: number }>;
  categoryBudgets: Array<{
    id: string;
    name: string;
    color?: string | null;
    budgetCeiling: number;
    spent: number;
  }>;
  upcomingInstallments: Array<{
    id: string;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    expense: {
      title: string;
    };
    financialCycle?: FinancialCycle | null;
  }>;
}

export interface AppSettings {
  cycleStartDay: number | null;
  cycleEndDay: number | null;
  updatedAt?: string;
}

export interface MonthlyControlData {
  cycle: FinancialCycle | null;
  availableCycles: FinancialCycle[];
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    remainingBudget: number;
    totalInvested: number;
    currentPortfolioValue: number;
  };
  cycleSummary: {
    operationalExpenses: number;
    extraordinaryExpenses: number;
    patrimonialExpenses: number;
    operationalBalance: number;
    netCashFlow: number;
  };
  expenseByCategory: Array<{ name: string; value: number }>;
  investmentAllocation: Array<{ name: string; value: number }>;
  monthlyOverview: Array<{ name: string; value: number }>;
  categoryBudgets: Array<{
    id: string;
    name: string;
    color?: string | null;
    budgetCeiling: number;
    spent: number;
  }>;
  upcomingInstallments: Array<{
    id: string;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    expense: {
      title: string;
    };
    financialCycle?: FinancialCycle | null;
  }>;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthStatus {
  hasUser: boolean;
  hasConfiguredUser: boolean;
  needsBootstrap: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
