import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowDown,
  BarChart3,
  BriefcaseBusiness,
  Check,
  HandCoins,
  Landmark,
  Scale,
  ShieldEllipsis,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { Panel } from "../components/Panel";
import { SectionHeader } from "../components/SectionHeader";
import { ValueVisibilityToggleButton } from "../components/ValueVisibilityToggleButton";
import { useValueVisibility } from "../contexts/value-visibility-context";
import {
  fetchAssets,
  fetchDashboard,
  fetchInvestments,
  fetchLoans
} from "../services/queries";
import type { Asset, DashboardData, Investment, Loan } from "../types/api";
import { formatEnumLabel } from "../utils/format";

const chartColors = ["#7dd3fc", "#60a5fa", "#38bdf8", "#93c5fd", "#0ea5e9", "#bae6fd"];
const patrimonyItemColors: Record<string, string> = {
  Caixa: "#7dd3fc",
  Investimentos: "#60a5fa",
  "Valores a receber": "#38bdf8",
  "Bens patrimoniais": "#93c5fd",
  FGTS: "#0ea5e9"
};

type PatrimonyToggleKey = "cash" | "investments" | "receivables" | "assets" | "fgts";

const defaultPatrimonyVisibility: Record<PatrimonyToggleKey, boolean> = {
  cash: true,
  investments: true,
  receivables: true,
  assets: true,
  fgts: true
};

function useAnimatedNumber(targetValue: number, duration = 160) {
  const [displayValue, setDisplayValue] = useState(targetValue);

  useEffect(() => {
    const startValue = displayValue;

    if (Math.abs(targetValue - startValue) < 0.01) {
      setDisplayValue(targetValue);
      return;
    }

    const startedAt = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const nextValue = startValue + (targetValue - startValue) * eased;

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [displayValue, duration, targetValue]);

  return displayValue;
}

function ChartLegend({
  items
}: {
  items: Array<{ label: string; color: string; value?: string; percentage?: string }>;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.color}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-medium text-white">{item.label}</span>
          {item.percentage ? <span className="text-slate-400">{item.percentage}</span> : null}
          {item.value ? <span className="text-slate-400">{item.value}</span> : null}
        </div>
      ))}
    </div>
  );
}

function getPatrimonyItemColor(label: string) {
  return patrimonyItemColors[label] ?? "#7dd3fc";
}

function PatrimonyToggleCard({
  label,
  value,
  icon: Icon,
  tone,
  iconTone,
  enabled,
  onToggle,
  formatCurrencyValue
}: {
  label: string;
  value: number;
  icon: typeof WalletCards;
  tone: string;
  iconTone: string;
  enabled: boolean;
  onToggle: () => void;
  formatCurrencyValue: (value: number) => string;
}) {
  const animatedValue = useAnimatedNumber(enabled ? value : 0);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-3xl border p-4 text-left transition ${
        enabled ? `${tone} shadow-lg shadow-black/10` : "border-white/10 bg-white/5 opacity-60"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={`inline-flex rounded-2xl border p-3 ${
            enabled ? iconTone : "border-white/10 bg-white/5 text-slate-400"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-md border transition ${
            enabled
              ? "border-sky-300/30 bg-sky-300/15 text-sky-200"
              : "border-white/10 bg-transparent text-transparent"
          }`}
          aria-hidden="true"
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{formatCurrencyValue(animatedValue)}</p>
    </button>
  );
}

function getInvestmentCurrentDisplayValue(item: Investment) {
  if (item.assetType === "FIXED_INCOME" || item.assetType === "CASH_RESERVE") {
    return item.netCurrentValue ?? item.currentValue ?? item.amountInvested;
  }

  return item.currentValue ?? item.amountInvested;
}

function getReceivablesOutstandingTotal(loans: Loan[]) {
  return loans.reduce(
    (sum, loan) =>
      sum +
      loan.installments
        .filter((installment) => !installment.paidAt)
        .reduce((installmentsSum, installment) => installmentsSum + installment.amount, 0),
    0
  );
}

export function DashboardPage() {
  const { formatCurrencyValue } = useValueVisibility();
  const [baseData, setBaseData] = useState<DashboardData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [historicalCycles, setHistoricalCycles] = useState<DashboardData[]>([]);
  const [patrimonyVisibility, setPatrimonyVisibility] = useState(defaultPatrimonyVisibility);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fgtsTotal = useMemo(
    () =>
      assets
        .filter((item) => item.category === "FGTS")
        .reduce((sum, item) => sum + item.currentValue, 0),
    [assets]
  );
  const assetsTotal = useMemo(
    () =>
      assets
        .filter((item) => item.category !== "FGTS")
        .reduce((sum, item) => sum + item.currentValue, 0),
    [assets]
  );
  const investedValue = useMemo(
    () =>
      investments
        .filter((item) => item.assetType !== "CASH_RESERVE")
        .reduce((sum, item) => sum + getInvestmentCurrentDisplayValue(item), 0),
    [investments]
  );
  const cashTotal = useMemo(
    () =>
      investments
        .filter((item) => item.assetType === "CASH_RESERVE")
        .reduce((sum, item) => sum + getInvestmentCurrentDisplayValue(item), 0),
    [investments]
  );
  const receivablesTotal = useMemo(
    () => getReceivablesOutstandingTotal(loans),
    [loans]
  );
  const patrimonyItems = useMemo(
    () => [
      {
        key: "cash" as const,
        label: "Caixa",
        value: cashTotal,
        icon: WalletCards,
        tone: "border-sky-300/15 bg-sky-300/5",
        iconTone: "border-sky-300/20 bg-sky-300/10 text-sky-200"
      },
      {
        key: "investments" as const,
        label: "Investimentos",
        value: investedValue,
        icon: BriefcaseBusiness,
        tone: "border-sky-300/15 bg-sky-300/5",
        iconTone: "border-sky-300/20 bg-sky-300/10 text-sky-200"
      },
      {
        key: "receivables" as const,
        label: "Valores a receber",
        value: receivablesTotal,
        icon: HandCoins,
        tone: "border-sky-300/15 bg-sky-300/5",
        iconTone: "border-sky-300/20 bg-sky-300/10 text-sky-200"
      },
      {
        key: "assets" as const,
        label: "Bens patrimoniais",
        value: assetsTotal,
        icon: Landmark,
        tone: "border-sky-300/15 bg-sky-300/5",
        iconTone: "border-sky-300/20 bg-sky-300/10 text-sky-200"
      },
      {
        key: "fgts" as const,
        label: "FGTS",
        value: fgtsTotal,
        icon: ShieldEllipsis,
        tone: "border-sky-300/15 bg-sky-300/5",
        iconTone: "border-sky-300/20 bg-sky-300/10 text-sky-200"
      }
    ],
    [assetsTotal, cashTotal, fgtsTotal, investedValue, receivablesTotal]
  );
  const patrimonyTotal = useMemo(
    () =>
      patrimonyItems.reduce(
        (sum, item) => sum + (patrimonyVisibility[item.key] ? item.value : 0),
        0
      ),
    [patrimonyItems, patrimonyVisibility]
  );
  const animatedPatrimonyTotal = useAnimatedNumber(patrimonyTotal);
  const patrimonyComposition = useMemo(
    () =>
      [
        { name: "Bens patrimoniais", value: assetsTotal },
        { name: "Caixa", value: cashTotal },
        { name: "Investimentos", value: investedValue },
        { name: "Valores a receber", value: receivablesTotal },
        { name: "FGTS", value: fgtsTotal }
      ]
        .filter((item) => item.value > 0)
        .sort((left, right) => right.value - left.value),
    [assetsTotal, cashTotal, fgtsTotal, investedValue, receivablesTotal]
  );
  const patrimonyCompositionTotal = useMemo(
    () => patrimonyComposition.reduce((sum, item) => sum + item.value, 0),
    [patrimonyComposition]
  );
  const monthlyComparison = useMemo(
    () =>
      historicalCycles
        .filter((item) => item.cycle)
        .map((item) => ({
          name: item.cycle?.referenceLabel ?? item.cycle?.name ?? "Ciclo",
          entradas: item.metrics.totalIncome,
          saidas: item.metrics.totalExpenses
        })),
    [historicalCycles]
  );

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const dashboardData = await fetchDashboard();
        const [assetsData, investmentsData, loansData] = await Promise.all([
          fetchAssets(),
          fetchInvestments(),
          fetchLoans()
        ]);

        setBaseData(dashboardData);
        setAssets(assetsData);
        setInvestments(investmentsData);
        setLoans(loansData);

        if (dashboardData.availableCycles.length > 0) {
          const cyclesToCompare = dashboardData.availableCycles.slice(-6);
          const cycleResponses = await Promise.all(
            cyclesToCompare.map((cycle) => fetchDashboard(cycle.id))
          );
          setHistoricalCycles(cycleResponses);
        } else {
          setHistoricalCycles([]);
        }
      } catch {
        setError("Não foi possível carregar o dashboard. Confirme se a API está rodando.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !baseData) {
    return (
      <EmptyState
        title="Visão geral indisponível"
        description={error ?? "Não há dados suficientes para montar o painel."}
      />
    );
  }

  function togglePatrimonyItem(key: PatrimonyToggleKey) {
    setPatrimonyVisibility((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Visão Geral"
        description="Uma leitura executiva da sua evolução financeira, patrimônio atual e distribuição dos recursos."
        action={<ValueVisibilityToggleButton />}
      />

      <section className="rounded-[32px] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(125,211,252,0.1),rgba(15,23,42,0.1))] p-6 shadow-2xl shadow-black/20">
        <div className="space-y-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Total consolidado
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-300">Patrimônio total atual</p>
              <p className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {formatCurrencyValue(animatedPatrimonyTotal)}
              </p>
            </div>
            <p className="max-w-xl text-sm text-slate-400">
              O total considera apenas os itens marcados abaixo e atualiza automaticamente conforme a sua seleção.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {patrimonyItems.map((item) => (
              <PatrimonyToggleCard
                key={item.key}
                label={item.label}
                value={item.value}
                icon={item.icon}
                tone={item.tone}
                iconTone={item.iconTone}
                enabled={patrimonyVisibility[item.key]}
                onToggle={() => togglePatrimonyItem(item.key)}
                formatCurrencyValue={formatCurrencyValue}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title="Comparativo mês a mês"
          subtitle="Entradas e saídas dos últimos ciclos disponíveis"
          icon={BarChart3}
          iconColor="#7dd3fc"
          tone="info"
        >
          <div className="space-y-4">
            {monthlyComparison.length > 0 ? (
              <>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip formatter={(value: number) => formatCurrencyValue(value)} />
                      <Bar dataKey="entradas" name="Entradas" radius={[16, 16, 0, 0]} fill="#7dd3fc" />
                      <Bar dataKey="saidas" name="Saídas" radius={[16, 16, 0, 0]} fill="#60a5fa" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ChartLegend
                  items={[
                    { label: "Entradas", color: "#7dd3fc" },
                    { label: "Saídas", color: "#60a5fa" }
                  ]}
                />
              </>
            ) : (
              <EmptyState
                title="Sem histórico suficiente"
                description="Os comparativos mensais aparecerão quando houver ciclos financeiros disponíveis."
              />
            )}
          </div>
        </Panel>

        <Panel
          title="Composição do patrimônio"
          subtitle="Como seu patrimônio está distribuído hoje"
          icon={ShieldCheck}
          iconColor="#7dd3fc"
          tone="patrimonial"
        >
          <div className="space-y-4">
            {patrimonyComposition.length > 0 ? (
              <>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={patrimonyComposition}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={110}
                      >
                        {patrimonyComposition.map((entry) => (
                          <Cell key={entry.name} fill={getPatrimonyItemColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrencyValue(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ChartLegend
                  items={patrimonyComposition.map((item) => ({
                    label: item.name,
                    color: getPatrimonyItemColor(item.name),
                    percentage:
                      patrimonyCompositionTotal > 0
                        ? `${((item.value / patrimonyCompositionTotal) * 100).toFixed(1).replace(".", ",")}%`
                        : "0,0%",
                    value: formatCurrencyValue(item.value)
                  }))}
                />
              </>
            ) : (
              <EmptyState
                title="Sem patrimônio registrado"
                description="Cadastre bens, investimentos ou valores a receber para visualizar a composição."
              />
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel
          title="Alocação dos investimentos"
          subtitle="Distribuição atual por tipo de ativo"
          icon={BriefcaseBusiness}
          iconColor="#7dd3fc"
          tone="patrimonial"
        >
          <div className="space-y-4">
            {baseData.investmentAllocation.filter((item) => item.name !== "CASH_RESERVE").length > 0 ? (
              <>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={baseData.investmentAllocation.filter((item) => item.name !== "CASH_RESERVE").map((item) => ({
                          ...item,
                          name: formatEnumLabel(item.name)
                        }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={68}
                        outerRadius={112}
                      >
                        {baseData.investmentAllocation.filter((item) => item.name !== "CASH_RESERVE").map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrencyValue(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ChartLegend
                  items={baseData.investmentAllocation.filter((item) => item.name !== "CASH_RESERVE").map((item, index) => ({
                    label: formatEnumLabel(item.name),
                    color: chartColors[index % chartColors.length],
                    value: formatCurrencyValue(item.value)
                  }))}
                />
              </>
            ) : (
              <EmptyState
                title="Sem dados de investimento"
                description="Cadastre ativos para visualizar sua alocação."
              />
            )}
          </div>
        </Panel>

        <Panel
          title="Leituras rápidas"
          subtitle="Indicadores do contexto atual"
          icon={ArrowDown}
          iconColor="#7dd3fc"
          tone="neutral"
        >
          <div className="space-y-4">
            <div className="space-y-1 px-1">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ciclo atual</p>
              <p className="text-sm font-medium text-slate-300">
                {baseData.cycle?.referenceLabel ?? "Sem ciclo"}
              </p>
            </div>

            <div className="grid gap-3">
              <article className="rounded-3xl border border-sky-300/15 bg-sky-300/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Entradas</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {formatCurrencyValue(baseData.metrics.totalIncome)}
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                    <ArrowUpCircle className="h-5 w-5" />
                  </span>
                </div>
              </article>

              <article className="rounded-3xl border border-sky-300/15 bg-sky-300/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Saídas operacionais</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {formatCurrencyValue(baseData.cycleSummary.operationalExpenses)}
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                    <ArrowDownCircle className="h-5 w-5" />
                  </span>
                </div>
              </article>

              <article className="rounded-3xl border border-sky-300/15 bg-sky-300/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Saídas extraordinárias</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {formatCurrencyValue(baseData.cycleSummary.extraordinaryExpenses)}
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                    <ArrowDownCircle className="h-5 w-5" />
                  </span>
                </div>
              </article>

              <article className="rounded-3xl border border-sky-300/15 bg-sky-300/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Saídas patrimoniais</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {formatCurrencyValue(baseData.cycleSummary.patrimonialExpenses)}
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                    <ArrowDownCircle className="h-5 w-5" />
                  </span>
                </div>
              </article>

              <article className="rounded-3xl border border-sky-300/15 bg-sky-300/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Saldo do ciclo</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {formatCurrencyValue(baseData.cycleSummary.netCashFlow)}
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                    <Scale className="h-5 w-5" />
                  </span>
                </div>
              </article>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
