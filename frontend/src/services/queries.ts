import { api } from "./api";
import type {
  AppSettings,
  Asset,
  Category,
  DashboardData,
  Expense,
  FinancialCycle,
  Income,
  Investment,
  Loan,
  MonthlyControlData
} from "../types/api";

export async function fetchDashboard(cycleId?: string) {
  const { data } = await api.get<DashboardData>("/dashboard", {
    params: cycleId ? { cycleId } : undefined
  });
  return data;
}

export async function fetchMonthlyControl(cycleId?: string) {
  const { data } = await api.get<MonthlyControlData>("/dashboard", {
    params: cycleId ? { cycleId } : undefined
  });
  return data;
}

export async function fetchExpenses() {
  const { data } = await api.get<Expense[]>("/expenses");
  return data;
}

export async function createExpense(payload: Record<string, unknown>) {
  const { data } = await api.post<Expense>("/expenses", payload);
  return data;
}

export async function updateExpense(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put<Expense>(`/expenses/${id}`, payload);
  return data;
}

export async function deleteExpense(id: string) {
  await api.delete(`/expenses/${id}`);
}

export async function fetchIncome() {
  const { data } = await api.get<Income[]>("/income");
  return data;
}

export async function createIncome(payload: Record<string, unknown>) {
  const { data } = await api.post<Income>("/income", payload);
  return data;
}

export async function updateIncome(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put<Income>(`/income/${id}`, payload);
  return data;
}

export async function deleteIncome(id: string) {
  await api.delete(`/income/${id}`);
}

export async function fetchInvestments() {
  const { data } = await api.get<Investment[]>("/investments");
  return data;
}

export async function fetchAssets() {
  const { data } = await api.get<Asset[]>("/assets");
  return data;
}

export async function createAsset(payload: Record<string, unknown>) {
  const { data } = await api.post<Asset>("/assets", payload);
  return data;
}

export async function updateAsset(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put<Asset>(`/assets/${id}`, payload);
  return data;
}

export async function deleteAsset(id: string) {
  await api.delete(`/assets/${id}`);
}

export async function fetchLoans() {
  const { data } = await api.get<Loan[]>("/loans");
  return data;
}

export async function createLoan(payload: Record<string, unknown>) {
  const { data } = await api.post<Loan>("/loans", payload);
  return data;
}

export async function deleteLoan(id: string) {
  await api.delete(`/loans/${id}`);
}

export async function updateLoanInstallmentStatus(id: string, isPaid: boolean) {
  const { data } = await api.patch(`/loans/installments/${id}`, { isPaid });
  return data;
}

export async function createInvestment(payload: Record<string, unknown>) {
  const { data } = await api.post<Investment>("/investments", payload);
  return data;
}

export async function updateInvestment(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put<Investment>(`/investments/${id}`, payload);
  return data;
}

export async function deleteInvestment(id: string) {
  await api.delete(`/investments/${id}`);
}

export async function fetchCycles() {
  const { data } = await api.get<FinancialCycle[]>("/financial-cycles");
  return data;
}

export async function createCycle(payload: Record<string, unknown>) {
  const { data } = await api.post<FinancialCycle>("/financial-cycles", payload);
  return data;
}

export async function fetchCategories() {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function createCategory(payload: Record<string, unknown>) {
  const { data } = await api.post<Category>("/categories", payload);
  return data;
}

export async function updateCategory(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put<Category>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
}

export async function fetchSettings() {
  const { data } = await api.get<AppSettings>("/settings");
  return data;
}

export async function updateSettings(payload: AppSettings) {
  const { data } = await api.patch<AppSettings>("/settings", payload);
  return data;
}
