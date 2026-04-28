import { ArrowDownCircle, ArrowUpCircle, ChartColumnBig, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { Panel } from "../components/Panel";
import { SectionHeader } from "../components/SectionHeader";
import { ValueVisibilityToggleButton } from "../components/ValueVisibilityToggleButton";
import { useValueVisibility } from "../contexts/value-visibility-context";
import { fetchDashboard, fetchExpenses, fetchIncome } from "../services/queries";
import type { Category, DashboardData, Expense, Income } from "../types/api";
import { formatDate } from "../utils/format";

function formatCycleOptionLabel(startDate: string, referenceLabel?: string | null) {
  if (referenceLabel) {
    return referenceLabel;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "2-digit",
    timeZone: "UTC"
  }).format(new Date(startDate));
}

function getCategoryPresentation(category?: Category | null) {
  const color = category?.color ?? "#7dd3fc";

  return {
    label: category?.name ?? "Sem categoria",
    color
  };
}

export function MonthlyControlPage() {
  const { formatCurrencyValue } = useValueVisibility();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<Income[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBaseData() {
      setLoading(true);
      setError(null);

      try {
        const [dashboardResponse, expensesResponse, incomeResponse] = await Promise.all([
          fetchDashboard(),
          fetchExpenses(),
          fetchIncome()
        ]);

        setDashboardData(dashboardResponse);
        setExpenses(expensesResponse);
        setIncomeEntries(incomeResponse);
        setSelectedCycleId(dashboardResponse.cycle?.id ?? dashboardResponse.availableCycles[0]?.id ?? "");
      } catch {
        setError("Não foi possível carregar o controle mensal.");
      } finally {
        setLoading(false);
      }
    }

    void loadBaseData();
  }, []);

  useEffect(() => {
    if (!selectedCycleId) {
      return;
    }

    async function refreshCycle() {
      setLoading(true);
      setError(null);

      try {
        const cycleData = await fetchDashboard(selectedCycleId);
        setDashboardData(cycleData);
      } catch {
        setError("Não foi possível atualizar o ciclo selecionado.");
      } finally {
        setLoading(false);
      }
    }

    void refreshCycle();
  }, [selectedCycleId]);

  const activeCycle = dashboardData?.cycle ?? null;

  const cycleExpenses = useMemo(() => {
    if (!activeCycle) {
      return [];
    }

    const start = new Date(activeCycle.startDate).getTime();
    const end = new Date(activeCycle.endDate).getTime();

    return expenses.filter((expense) => {
      const purchaseTime = new Date(expense.purchaseDate).getTime();
      return purchaseTime >= start && purchaseTime <= end;
    });
  }, [activeCycle, expenses]);

  const cycleIncome = useMemo(() => {
    if (!activeCycle) {
      return [];
    }

    const start = new Date(activeCycle.startDate).getTime();
    const end = new Date(activeCycle.endDate).getTime();

    return incomeEntries.filter((entry) => {
      const receivedTime = new Date(entry.receivedAt).getTime();
      return receivedTime >= start && receivedTime <= end;
    });
  }, [activeCycle, incomeEntries]);

  const cycleTotals = useMemo(
    () => ({
      totalOut: cycleExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      totalIn: cycleIncome.reduce((sum, entry) => sum + entry.amount, 0),
      operationalOut: cycleExpenses
        .filter((expense) => expense.expenseKind === "OPERATIONAL")
        .reduce((sum, expense) => sum + expense.amount, 0),
      extraordinaryOut: cycleExpenses
        .filter((expense) => expense.expenseKind === "EXTRAORDINARY")
        .reduce((sum, expense) => sum + expense.amount, 0),
      patrimonialOut: cycleExpenses
        .filter((expense) => expense.expenseKind === "PATRIMONIAL")
        .reduce((sum, expense) => sum + expense.amount, 0)
    }),
    [cycleExpenses, cycleIncome]
  );

  const monthlyBudget = useMemo(
    () => dashboardData?.categoryBudgets.reduce((sum, category) => sum + category.budgetCeiling, 0) ?? 0,
    [dashboardData]
  );

  const budgetProgress =
    monthlyBudget > 0 ? Math.min((cycleTotals.operationalOut / monthlyBudget) * 100, 100) : 0;
  const monthlyResultScaleMax = useMemo(
    () => Math.max(cycleTotals.totalOut, monthlyBudget, cycleTotals.totalIn, 1),
    [cycleTotals.totalIn, cycleTotals.totalOut, monthlyBudget]
  );
  const totalSpentProgress = (cycleTotals.totalOut / monthlyResultScaleMax) * 100;
  const budgetMarkProgress = (monthlyBudget / monthlyResultScaleMax) * 100;
  const incomeMarkProgress = (cycleTotals.totalIn / monthlyResultScaleMax) * 100;
  const cycleNetResult = cycleTotals.totalIn - cycleTotals.totalOut;
  const categorySpending = useMemo(() => {
    const grouped = cycleExpenses.reduce<
      Array<{ key: string; label: string; color: string; amount: number }>
    >((accumulator, expense) => {
      const presentation = getCategoryPresentation(expense.category);
      const key = expense.category?.id ?? presentation.label;
      const existing = accumulator.find((item) => item.key === key);

      if (existing) {
        existing.amount += expense.amount;
        return accumulator;
      }

      accumulator.push({
        key,
        label: presentation.label,
        color: presentation.color,
        amount: expense.amount
      });

      return accumulator;
    }, []);

    return grouped.sort((left, right) => right.amount - left.amount);
  }, [cycleExpenses]);

  const timelineItems = useMemo(() => {
    const expenseItems = cycleExpenses.map((expense) => ({
      id: `expense-${expense.id}`,
      type: "expense" as const,
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      expenseKind: expense.expenseKind,
      occurredAt: expense.purchaseDate
    }));
    const incomeItems = cycleIncome.map((entry) => ({
      id: `income-${entry.id}`,
      type: "income" as const,
      title: entry.sourceName,
      category: entry.category,
      amount: entry.amount,
      expenseKind: undefined,
      occurredAt: entry.receivedAt
    }));

    return [...expenseItems, ...incomeItems].sort(
      (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    );
  }, [cycleExpenses, cycleIncome]);
  if (loading && !dashboardData) {
    return <LoadingState />;
  }

  if (error || !dashboardData || !activeCycle) {
    return (
      <EmptyState
        title="Controle mensal indisponível"
        description={error ?? "Configure um ciclo mensal para visualizar essa área."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Controle Mensal"
        description="Acompanhe orçamento, entradas, saldo e o extrato consolidado do ciclo selecionado."
        action={<ValueVisibilityToggleButton />}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1 px-1">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Período do ciclo</p>
          <p className="text-sm text-slate-400">
            {formatDate(activeCycle.startDate)} até {formatDate(activeCycle.endDate)}
          </p>
        </div>

        <label className="block w-full max-w-[220px] space-y-2 lg:text-right">
          <span className="text-sm font-medium text-slate-200">Filtrar</span>
          <select
            value={selectedCycleId}
            onChange={(event) => setSelectedCycleId(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-ink/80 px-4 py-3 text-sm text-white outline-none"
          >
            {dashboardData.availableCycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {formatCycleOptionLabel(cycle.startDate, cycle.referenceLabel)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-1">
        <Panel
          title="Entradas"
          subtitle="Total recebido dentro do ciclo selecionado"
          icon={WalletCards}
          iconColor="#6ee7b7"
          tone="positive"
          className="border-sky-300/12 bg-[linear-gradient(135deg,rgba(125,211,252,0.05),rgba(15,23,42,0.18))]"
        >
          <div className="space-y-2">
            <p className="text-4xl font-semibold text-white">{formatCurrencyValue(cycleTotals.totalIn)}</p>
            <p className="text-sm text-slate-400">Somatório de tudo que entrou dentro do período.</p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr_1fr]">
        <Panel
          title="Gastos operacionais"
          subtitle="Rotina do mês em relação ao limite definido nas categorias"
          icon={WalletCards}
          iconColor="#f4d27a"
          tone="warning"
          className="border-sky-300/12 bg-[linear-gradient(135deg,rgba(125,211,252,0.05),rgba(15,23,42,0.18))]"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold text-white">
                  {formatCurrencyValue(cycleTotals.operationalOut)}
                  <span className="ml-2 text-lg font-medium text-slate-400">
                    de {monthlyBudget > 0 ? formatCurrencyValue(monthlyBudget) : "sem limite"}
                  </span>
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {monthlyBudget > 0
                    ? "Mostra quanto do orçamento operacional já foi consumido."
                    : "Defina limites nas categorias para acompanhar o teto dos gastos operacionais."}
                </p>
              </div>
              {monthlyBudget > 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white">
                  {budgetProgress.toFixed(0)}%
                </div>
              ) : null}
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${
                  "bg-sky-300"
                }`}
                style={{ width: `${monthlyBudget > 0 ? budgetProgress : 0}%` }}
              />
            </div>
          </div>
        </Panel>

        <MetricCard
          label="Gastos extraordinários"
          value={cycleTotals.extraordinaryOut}
          helper="Decisões pontuais fora da rotina do mês"
          icon={<ArrowDownCircle className="h-5 w-5" />}
          tone="warning"
          className="border-sky-300/12 bg-sky-300/4"
        />

        <MetricCard
          label="Gastos patrimoniais"
          value={cycleTotals.patrimonialOut}
          helper="Parcelas e saídas ligadas à construção de patrimônio"
          icon={<ArrowDownCircle className="h-5 w-5" />}
          tone="warning"
          className="border-sky-300/18 bg-sky-300/6"
        />
      </div>

      <Panel
        title="Resultado do mês"
        subtitle="O preenchimento mostra o total gasto no ciclo em relação ao seu limite e ao que entrou"
        icon={ArrowDownCircle}
        iconColor="#7dd3fc"
        tone="info"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Total gasto no ciclo</p>
              <p className="text-4xl font-semibold text-white">
                {formatCurrencyValue(cycleTotals.totalOut)}
              </p>
            </div>

            <div className="space-y-1 text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Leitura</p>
              <p className="text-sm text-slate-300">
                {monthlyBudget > 0 && cycleTotals.totalOut <= monthlyBudget
                  ? "Dentro do limite planejado"
                  : cycleTotals.totalOut <= cycleTotals.totalIn
                    ? "Acima do limite, mas abaixo do que entrou"
                    : "Gastou mais do que entrou"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative pt-6">
              <div className="relative h-5 overflow-hidden rounded-full border border-white/10 bg-white/5">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(125,211,252,0.9),rgba(96,165,250,0.95))] transition-all duration-500"
                  style={{ width: `${Math.min(totalSpentProgress, 100)}%` }}
                />
              </div>

              {monthlyBudget > 0 ? (
                <div
                  className="pointer-events-none absolute inset-y-0 top-0 flex -translate-x-1/2 flex-col items-center"
                  style={{ left: `${Math.min(budgetMarkProgress, 100)}%` }}
                >
                  <span className="mb-1 whitespace-nowrap text-[11px] font-medium text-slate-300">
                    Limite
                  </span>
                  <span className="h-8 w-px bg-sky-200/80" />
                </div>
              ) : null}

              <div
                className="pointer-events-none absolute inset-y-0 top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${Math.min(incomeMarkProgress, 100)}%` }}
              >
                <span className="mb-1 whitespace-nowrap text-[11px] font-medium text-slate-300">
                  Entradas
                </span>
                <span className="h-8 w-px bg-sky-200/80" />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Gasto atual</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatCurrencyValue(cycleTotals.totalOut)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Limite de gasto</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {monthlyBudget > 0 ? formatCurrencyValue(monthlyBudget) : "Não definido"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Entradas do ciclo</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatCurrencyValue(cycleTotals.totalIn)}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400">
              Saldo do ciclo: <span className="font-medium text-white">{formatCurrencyValue(cycleNetResult)}</span>
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        title="Gastos por categoria"
        subtitle="Quanto saiu em cada categoria dentro do ciclo selecionado"
        icon={ChartColumnBig}
        iconColor="#7dd3fc"
        tone="neutral"
      >
        <div className="space-y-3">
          {categorySpending.length > 0 ? (
            categorySpending.map((item) => {
              const progress = cycleTotals.totalOut > 0 ? (item.amount / cycleTotals.totalOut) * 100 : 0;

              return (
                <article key={item.key} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3 md:min-w-0 md:flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${item.color}22`,
                            color: item.color
                          }}
                        >
                          {item.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {progress.toFixed(1).replace(".", ",")}%
                        </span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>

                    <p className="text-lg font-semibold text-sky-300">
                      {formatCurrencyValue(item.amount)}
                    </p>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="Nenhum gasto por categoria"
              description="As categorias aparecerão aqui quando houver despesas lançadas neste ciclo."
            />
          )}
        </div>
      </Panel>

      <Panel
        title="Extrato do ciclo"
        subtitle="Lançamentos do mais recente para o mais antigo"
        icon={WalletCards}
        iconColor="#7dd3fc"
        tone="neutral"
      >
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {timelineItems.length > 0 ? (
            timelineItems.map((item) => {
              const category = getCategoryPresentation(item.category);
              const isIncome = item.type === "income";

              return (
                <article
                  key={item.id}
                  className={`rounded-2xl px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${
                    isIncome
                      ? "border border-emerald-400/12 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(15,23,42,0.18))]"
                      : "border border-rose-400/12 bg-[linear-gradient(135deg,rgba(244,63,94,0.08),rgba(15,23,42,0.18))]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isIncome
                              ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                              : "border border-rose-300/20 bg-rose-300/10 text-rose-200"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                          )}
                          {isIncome ? "Entrou" : "Saiu"}
                        </span>
                        {!isIncome ? (
                          <span className="inline-flex items-center rounded-full border border-rose-300/20 bg-rose-300/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-200">
                            {item.expenseKind === "EXTRAORDINARY"
                              ? "Extraordinário"
                              : item.expenseKind === "PATRIMONIAL"
                                ? "Patrimonial"
                                : "Operacional"}
                          </span>
                        ) : null}
                        <span className="text-[11px] text-slate-500">{formatDate(item.occurredAt)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                            isIncome ? "bg-emerald-300/12 text-emerald-200" : "bg-rose-300/12 text-rose-200"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownCircle className="h-4 w-4" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4" />
                          )}
                        </span>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                          style={{
                            backgroundColor: `${category.color}22`,
                            color: category.color
                          }}
                        >
                          {category.label}
                        </span>
                      </div>
                    </div>

                    <p
                      className={`shrink-0 text-sm font-semibold ${
                        isIncome ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {formatCurrencyValue(item.amount)}
                    </p>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="Nenhum lançamento no ciclo"
              description="Cadastre despesas ou receitas dentro desse período para visualizar o extrato."
            />
          )}
        </div>
      </Panel>
    </div>
  );
}
