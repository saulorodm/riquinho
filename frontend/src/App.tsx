import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { LoadingState } from "./components/LoadingState";
import { useAuth } from "./contexts/auth-context";
import { ValueVisibilityProvider } from "./contexts/value-visibility-context";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage }))
);
const MonthlyControlPage = lazy(() =>
  import("./pages/MonthlyControlPage").then((module) => ({ default: module.MonthlyControlPage }))
);
const ExpensesPage = lazy(() =>
  import("./pages/ExpensesPage").then((module) => ({ default: module.ExpensesPage }))
);
const IncomePage = lazy(() =>
  import("./pages/IncomePage").then((module) => ({ default: module.IncomePage }))
);
const CashPage = lazy(() =>
  import("./pages/CashPage").then((module) => ({ default: module.CashPage }))
);
const InvestmentsPage = lazy(() =>
  import("./pages/InvestmentsPage").then((module) => ({ default: module.InvestmentsPage }))
);
const AssetsPage = lazy(() =>
  import("./pages/AssetsPage").then((module) => ({ default: module.AssetsPage }))
);
const FgtsPage = lazy(() =>
  import("./pages/FgtsPage").then((module) => ({ default: module.FgtsPage }))
);
const LoansPage = lazy(() =>
  import("./pages/LoansPage").then((module) => ({ default: module.LoansPage }))
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage }))
);

export default function App() {
  const { initializing, user } = useAuth();

  if (initializing) {
    return <LoadingState />;
  }

  return (
    <ValueVisibilityProvider>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate replace to="/dashboard" /> : <LoginPage />} />
          <Route element={user ? <AppLayout /> : <Navigate replace to="/login" />}>
            <Route path="/" element={<Navigate replace to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/controle-mensal" element={<MonthlyControlPage />} />
            <Route path="/despesas" element={<ExpensesPage />} />
            <Route path="/receitas" element={<IncomePage />} />
            <Route path="/caixa" element={<CashPage />} />
            <Route path="/investimentos" element={<InvestmentsPage />} />
            <Route path="/patrimonio" element={<AssetsPage />} />
            <Route path="/fgts" element={<FgtsPage />} />
            <Route path="/valores-a-receber" element={<LoansPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ValueVisibilityProvider>
  );
}
