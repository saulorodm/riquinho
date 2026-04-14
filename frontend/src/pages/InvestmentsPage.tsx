import { BriefcaseBusiness, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "../components/EmptyState";
import { Field } from "../components/Field";
import { LastUpdatedLabel } from "../components/LastUpdatedLabel";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { SectionHeader } from "../components/SectionHeader";
import { ValueVisibilityToggleButton } from "../components/ValueVisibilityToggleButton";
import { useValueVisibility } from "../contexts/value-visibility-context";
import {
  createInvestment,
  deleteInvestment,
  fetchInvestments,
  updateInvestment
} from "../services/queries";
import type { Investment, InvestmentType } from "../types/api";
import { investmentTypeMeta } from "../utils/investment-type-meta";
import { formatCurrency, formatDate } from "../utils/format";
import { buildLastUpdatedText, getLatestTimestamp } from "../utils/last-updated";

function formatCurrencyInput(value: string) {
  const numericValue = Number(value || "0") / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(numericValue);
}

function parseCurrencyInput(value: string) {
  return value.replace(/\D/g, "");
}

function getTodayDateInputValue() {
  const now = new Date();
  const timezoneOffsetInMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffsetInMs).toISOString().slice(0, 10);
}

type InvestmentMode = "contribution" | "update";
type InvestmentSortOption =
  | "ASSET_TYPE"
  | "VALUE_DESC"
  | "VALUE_ASC"
  | "LATEST_CONTRIBUTION"
  | "OLDEST_CONTRIBUTION";
type InvestmentFilterOption = "ALL" | "FIXED_INCOME" | "VARIABLE_INCOME";

function isFixedIncomeProfile(assetType: InvestmentType) {
  return assetType === "FIXED_INCOME";
}

function getInvestmentCurrentDisplayValue(item: Investment) {
  if (isFixedIncomeProfile(item.assetType)) {
    return item.netCurrentValue ?? item.currentValue ?? item.amountInvested;
  }

  return item.currentValue ?? item.amountInvested;
}

export function InvestmentsPage() {
  const { formatCurrencyValue } = useValueVisibility();
  const [items, setItems] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<InvestmentMode>("contribution");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<InvestmentSortOption>("LATEST_CONTRIBUTION");
  const [filterBy, setFilterBy] = useState<InvestmentFilterOption>("ALL");
  const [form, setForm] = useState<{
    name: string;
    assetType: InvestmentType;
    amountInvested: string;
    quantity: string;
    unitPrice: string;
    currentQuantity: string;
    currentValue: string;
    netCurrentValue: string;
    investedAt: string;
  }>({
    name: "",
    assetType: "STOCKS_ETFS",
    amountInvested: "",
    quantity: "",
    unitPrice: "",
    currentQuantity: "",
    currentValue: "",
    netCurrentValue: "",
    investedAt: getTodayDateInputValue()
  });
  const selectedTypeMeta = useMemo(() => investmentTypeMeta[form.assetType], [form.assetType]);
  const isQuotaBased = selectedTypeMeta.quotaBased;
  const isManualValuation = !isQuotaBased;
  const contributionPreview = useMemo(() => {
    if (!isQuotaBased) {
      return Number(form.amountInvested || "0") / 100;
    }

    const quantity = Number(form.quantity || "0");
    const unitPrice = Number(form.unitPrice || "0") / 100;
    return Number((quantity * unitPrice).toFixed(2));
  }, [form.amountInvested, form.quantity, form.unitPrice, isQuotaBased]);
  const investmentsTotal = useMemo(
    () => items.reduce((sum, item) => sum + getInvestmentCurrentDisplayValue(item), 0),
    [items]
  );
  const lastUpdatedText = useMemo(
    () =>
      buildLastUpdatedText(
        "investimentos",
        getLatestTimestamp(items.map((item) => item.updatedAt ?? item.createdAt))
      ),
    [items]
  );
  const visibleItems = useMemo(() => {
    const filteredItems = items.filter((item) => {
      if (filterBy === "ALL") {
        return true;
      }

      if (filterBy === "FIXED_INCOME") {
        return isFixedIncomeProfile(item.assetType);
      }

      return !isFixedIncomeProfile(item.assetType);
    });

    return [...filteredItems].sort((left, right) => {
      if (sortBy === "ASSET_TYPE") {
        const typeLabelCompare = investmentTypeMeta[left.assetType].label.localeCompare(
          investmentTypeMeta[right.assetType].label,
          "pt-BR"
        );

        if (typeLabelCompare !== 0) {
          return typeLabelCompare;
        }

        return left.name.localeCompare(right.name, "pt-BR");
      }

      if (sortBy === "VALUE_DESC") {
        return getInvestmentCurrentDisplayValue(right) - getInvestmentCurrentDisplayValue(left);
      }

      if (sortBy === "VALUE_ASC") {
        return getInvestmentCurrentDisplayValue(left) - getInvestmentCurrentDisplayValue(right);
      }

      if (sortBy === "OLDEST_CONTRIBUTION") {
        return new Date(left.investedAt).getTime() - new Date(right.investedAt).getTime();
      }

      return new Date(right.investedAt).getTime() - new Date(left.investedAt).getTime();
    });
  }, [filterBy, items, sortBy]);

  function resetForm() {
    setMode("contribution");
    setUpdatingId(null);
    setFormError(null);
    setForm({
      name: "",
      assetType: "STOCKS_ETFS",
      amountInvested: "",
      quantity: "",
      unitPrice: "",
      currentQuantity: "",
      currentValue: "",
      netCurrentValue: "",
      investedAt: getTodayDateInputValue()
    });
  }

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchInvestments();
      setItems(data.filter((item) => item.assetType !== "CASH_RESERVE"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Informe o nome do ativo.");
      return;
    }

    if (mode === "update" && isQuotaBased && Number(form.currentQuantity || "0") <= 0) {
      setFormError("Informe a quantidade atual de cotas.");
      return;
    }

    if (
      mode === "update" &&
      form.assetType === "FIXED_INCOME" &&
      (Number(form.currentValue || "0") <= 0 || Number(form.netCurrentValue || "0") <= 0)
    ) {
      setFormError("Informe os valores bruto e líquido da renda fixa.");
      return;
    }

    if (mode === "contribution" && isQuotaBased && contributionPreview <= 0) {
      setFormError("Informe quantidade e valor por cota para registrar o aporte.");
      return;
    }

    if (mode === "contribution" && isManualValuation && Number(form.amountInvested || "0") <= 0) {
      setFormError("Informe o valor do aporte.");
      return;
    }

    if (
      mode === "contribution" &&
      form.assetType === "FIXED_INCOME" &&
      (Number(form.currentValue || "0") <= 0 || Number(form.netCurrentValue || "0") <= 0)
    ) {
      setFormError("Informe os valores bruto e líquido da renda fixa.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "update" && updatingId) {
        await updateInvestment(updatingId, {
          currentQuantity: isQuotaBased ? Number(form.currentQuantity || "0") : undefined,
          currentValue: isQuotaBased
            ? 0
            : Number(form.currentValue || "0") / 100,
          netCurrentValue:
            form.assetType === "FIXED_INCOME"
              ? Number(form.netCurrentValue || "0") / 100
              : undefined
        });
      } else {
        await createInvestment({
          name: form.name,
          assetType: form.assetType,
          investedAt: new Date(form.investedAt).toISOString(),
          amountInvested: isQuotaBased ? undefined : Number(form.amountInvested || "0") / 100,
          currentValue:
            form.assetType === "FIXED_INCOME"
              ? Number(form.currentValue || "0") / 100
              : undefined,
          netCurrentValue:
            form.assetType === "FIXED_INCOME"
              ? Number(form.netCurrentValue || "0") / 100
              : undefined,
          quantity: isQuotaBased ? Number(form.quantity) : undefined,
          unitPrice: isQuotaBased ? Number(form.unitPrice || "0") / 100 : undefined
        });
      }

      resetForm();
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  function handleRefresh(item: Investment) {
    setMode("update");
    setUpdatingId(item.id);
    setForm({
      name: item.name,
      assetType: item.assetType,
      amountInvested: "",
      quantity: "",
      unitPrice: "",
      currentQuantity: item.currentQuantity ? String(item.currentQuantity) : item.quantity ? String(item.quantity) : "",
      currentValue: item.currentValue ? String(Math.round(item.currentValue * 100)) : "",
      netCurrentValue: item.netCurrentValue ? String(Math.round(item.netCurrentValue * 100)) : "",
      investedAt: item.investedAt.slice(0, 10),
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja excluir este investimento?")) {
      return;
    }

    await deleteInvestment(id);
    if (updatingId === id) {
      resetForm();
    }

    await loadData();
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Investimentos"
        description="Registre novos aportes para aumentar posição e use atualizar para revisar quantidade e valor atual da carteira."
        meta={lastUpdatedText ? <LastUpdatedLabel text={lastUpdatedText} /> : undefined}
        action={<ValueVisibilityToggleButton />}
      />

      <div className="grid gap-4 md:grid-cols-1">
        <Panel
          title="Valor total investido"
          subtitle="Somatório atual da carteira"
          icon={BriefcaseBusiness}
          iconColor="#7dd3fc"
          tone="patrimonial"
        >
          <p className="text-3xl font-semibold text-white">{formatCurrencyValue(investmentsTotal)}</p>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Panel
          title={mode === "update" ? "Atualizar posição" : "Novo aporte"}
          subtitle={
            mode === "update"
              ? "Atualize a posição atual do ativo na carteira"
              : "Registre aportes e some posição no mesmo ativo"
          }
        >
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field
              label="Nome do ativo"
              placeholder="Ex.: ETF Global"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              disabled={mode === "update"}
              required
            />
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-200">Tipo</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(Object.keys(investmentTypeMeta) as InvestmentType[])
                  .filter((type) => type !== "CASH_RESERVE")
                  .map((type) => {
                  const meta = investmentTypeMeta[type];
                  const Icon = meta.icon;
                  const isActive = form.assetType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={mode === "update"}
                      onClick={() => setForm((current) => ({ ...current, assetType: type }))}
                      className={`flex min-h-[116px] flex-col items-center justify-center gap-3 rounded-2xl border px-4 py-4 text-center transition ${
                        isActive
                          ? "border-white/30 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                      >
                        <Icon className="h-[18px] w-[18px] stroke-[2.25]" />
                      </span>
                      <span className="text-sm font-medium leading-tight text-white">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {mode === "contribution" ? (
              <>
                <div className={`grid gap-4 ${form.assetType === "FIXED_INCOME" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                  {isQuotaBased ? (
                    <>
                      <Field
                        label="Quantidade de cotas"
                        type="number"
                        step="0.0001"
                        value={form.quantity}
                        onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                        required
                      />
                      <Field
                        label="Valor por cota"
                        type="text"
                        inputMode="numeric"
                        value={form.unitPrice ? formatCurrencyInput(form.unitPrice) : ""}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, unitPrice: parseCurrencyInput(event.target.value) }))
                        }
                        required
                      />
                    </>
                  ) : form.assetType === "FIXED_INCOME" ? (
                    <>
                      <Field
                        label="Valor aplicado"
                        type="text"
                        inputMode="numeric"
                        value={form.amountInvested ? formatCurrencyInput(form.amountInvested) : ""}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, amountInvested: parseCurrencyInput(event.target.value) }))
                        }
                        required
                      />
                      <Field
                        label="Valor bruto atual"
                        type="text"
                        inputMode="numeric"
                        value={form.currentValue ? formatCurrencyInput(form.currentValue) : ""}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, currentValue: parseCurrencyInput(event.target.value) }))
                        }
                        required
                      />
                      <Field
                        label="Valor líquido de resgate"
                        type="text"
                        inputMode="numeric"
                        value={form.netCurrentValue ? formatCurrencyInput(form.netCurrentValue) : ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            netCurrentValue: parseCurrencyInput(event.target.value)
                          }))
                        }
                        required
                      />
                    </>
                  ) : (
                    <Field
                      label="Valor do aporte"
                      type="text"
                      inputMode="numeric"
                      value={form.amountInvested ? formatCurrencyInput(form.amountInvested) : ""}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, amountInvested: parseCurrencyInput(event.target.value) }))
                      }
                      required
                    />
                  )}
                  <Field
                    label="Data do aporte"
                    type="date"
                    value={form.investedAt}
                    onChange={(event) => setForm((current) => ({ ...current, investedAt: event.target.value }))}
                    required
                  />
                </div>
                {form.assetType === "FIXED_INCOME" ? (
                  <div className="rounded-3xl border border-sky-300/20 bg-sky-300/10 p-4 text-sm text-slate-200">
                    Registre o valor aplicado e informe também quanto essa posição vale no bruto e no líquido hoje.
                  </div>
                ) : (
                  <div className="rounded-3xl border border-sky-300/20 bg-sky-300/10 p-4 text-sm text-slate-200">
                    Valor calculado do aporte: <span className="font-semibold text-white">{formatCurrencyValue(contributionPreview)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {isQuotaBased ? (
                  <Field
                    label="Quantidade atual de cotas"
                    type="number"
                    step="0.0001"
                    value={form.currentQuantity}
                    onChange={(event) => setForm((current) => ({ ...current, currentQuantity: event.target.value }))}
                    required
                  />
                ) : form.assetType === "FIXED_INCOME" ? (
                  <>
                    <Field
                      label="Total bruto"
                      type="text"
                      inputMode="numeric"
                      value={form.currentValue ? formatCurrencyInput(form.currentValue) : ""}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, currentValue: parseCurrencyInput(event.target.value) }))
                      }
                      required
                    />
                    <Field
                      label="Total líquido"
                      type="text"
                      inputMode="numeric"
                      value={form.netCurrentValue ? formatCurrencyInput(form.netCurrentValue) : ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          netCurrentValue: parseCurrencyInput(event.target.value)
                        }))
                      }
                      required
                    />
                  </>
                ) : (
                  <Field
                    label="Valor atual total"
                    type="text"
                    inputMode="numeric"
                    value={form.currentValue ? formatCurrencyInput(form.currentValue) : ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, currentValue: parseCurrencyInput(event.target.value) }))
                    }
                    required
                  />
                )}
              </div>
            )}
            {mode === "update" && isQuotaBased ? (
              <div className="rounded-3xl border border-sky-300/20 bg-sky-300/10 p-4 text-sm text-slate-200">
                O valor atual desse ativo será recalculado automaticamente pela cotação de mercado.
                Você só precisa ajustar a quantidade de cotas quando houver compra ou venda.
              </div>
            ) : null}
            {mode === "update" && form.assetType === "FIXED_INCOME" ? (
              <div className="rounded-3xl border border-sky-300/20 bg-sky-300/10 p-4 text-sm text-slate-200">
                Atualize o total bruto e o total líquido atuais dessa posição.
              </div>
            ) : null}
            {formError ? <p className="text-sm text-sky-200">{formError}</p> : null}
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting
                ? "Salvando..."
                : mode === "update"
                  ? "Atualizar carteira"
                  : "Registrar aporte"}
            </PrimaryButton>
            {mode === "update" ? (
              <SecondaryButton type="button" onClick={resetForm}>
                Cancelar atualização
              </SecondaryButton>
            ) : null}
          </form>
        </Panel>

        <Panel title="Carteira atual" subtitle="Posições registradas manualmente">
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Filtro</span>
              <div className="flex items-center rounded-2xl border border-white/10 bg-ink/80 px-4">
                <select
                  value={filterBy}
                  onChange={(event) => setFilterBy(event.target.value as InvestmentFilterOption)}
                  className="w-full bg-transparent py-3 text-sm text-white outline-none"
                >
                  <option value="ALL" className="bg-slate-900 text-white">Todos os ativos</option>
                  <option value="FIXED_INCOME" className="bg-slate-900 text-white">Renda fixa</option>
                  <option value="VARIABLE_INCOME" className="bg-slate-900 text-white">Renda variável</option>
                </select>
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Ordenação</span>
              <div className="flex items-center rounded-2xl border border-white/10 bg-ink/80 px-4">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as InvestmentSortOption)}
                  className="w-full bg-transparent py-3 text-sm text-white outline-none"
                >
                  <option value="ASSET_TYPE" className="bg-slate-900 text-white">Tipo de ativo</option>
                  <option value="VALUE_DESC" className="bg-slate-900 text-white">Maior para menor</option>
                  <option value="VALUE_ASC" className="bg-slate-900 text-white">Menor para maior</option>
                  <option value="LATEST_CONTRIBUTION" className="bg-slate-900 text-white">Último aporte para o primeiro</option>
                  <option value="OLDEST_CONTRIBUTION" className="bg-slate-900 text-white">Primeiro para o último</option>
                </select>
              </div>
            </label>
          </div>
          <div className="space-y-3">
            {visibleItems.length > 0 ? (
              visibleItems.map((item) => (
                <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${investmentTypeMeta[item.assetType].color}22`,
                            color: investmentTypeMeta[item.assetType].color
                          }}
                        >
                          {(() => {
                            const Icon = investmentTypeMeta[item.assetType].icon;
                            return <Icon className="h-3.5 w-3.5" />;
                          })()}
                          {investmentTypeMeta[item.assetType].label}
                        </span>
                        <span>{formatDate(item.investedAt)}</span>
                        {item.currentQuantity ? <span>{item.currentQuantity} cotas</span> : null}
                        {item.assetType === "FIXED_INCOME" ? <span>Bruto e líquido</span> : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:min-w-[250px] md:justify-end">
                      <div className="text-left md:text-right">
                        <p className="text-sm text-slate-400">
                          Aportado: <span className="font-medium text-white">{formatCurrencyValue(item.amountInvested)}</span>
                        </p>
                        {isFixedIncomeProfile(item.assetType) ? (
                          <>
                            <p className="text-sm text-slate-400">
                              Bruto: <span className="font-medium text-white">{formatCurrencyValue(item.currentValue ?? item.amountInvested)}</span>
                            </p>
                            <p className="text-lg font-semibold text-sky-300">
                              Líquido: {formatCurrencyValue(item.netCurrentValue ?? item.currentValue ?? item.amountInvested)}
                            </p>
                          </>
                        ) : (
                          <p className="text-lg font-semibold text-sky-300">
                            Atual: {formatCurrencyValue(item.currentValue ?? item.amountInvested)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRefresh(item)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                          aria-label="Atualizar carteira"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            resetForm();
                            setForm((current) => ({
                              ...current,
                              name: item.name,
                              assetType: item.assetType
                            }));
                          }}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200 transition hover:bg-sky-300/20"
                          aria-label="Novo aporte"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200 transition hover:bg-sky-300/20"
                          aria-label="Excluir investimento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                title="Nenhum ativo encontrado"
                description="Ajuste o filtro ou cadastre um novo ativo para acompanhar a carteira."
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
