import { Pencil, Trash2 } from "lucide-react";
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
  createIncome,
  deleteIncome,
  fetchCategories,
  fetchIncome,
  updateIncome
} from "../services/queries";
import type { Category, Income } from "../types/api";
import { categoryIconMap } from "../utils/category-icon-registry";
import { incomeCategoryMeta } from "../utils/income-category-meta";
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

function getIncomeCategoryPresentation(category: Category) {
  const fallbackMeta = incomeCategoryMeta[category.name];
  const color = category.color ?? fallbackMeta?.color ?? "#7dd3fc";
  const Icon = (category.icon ? categoryIconMap[category.icon] : undefined) ?? fallbackMeta?.icon;

  return {
    color,
    Icon
  };
}

export function IncomePage() {
  const { formatCurrencyValue } = useValueVisibility();
  const [entries, setEntries] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    sourceName: "",
    amount: "",
    receivedAt: getTodayDateInputValue(),
    categoryId: ""
  });
  const lastUpdatedText = useMemo(
    () =>
      buildLastUpdatedText(
        "entradas",
        getLatestTimestamp(entries.map((entry) => entry.updatedAt ?? entry.createdAt))
      ),
    [entries]
  );

  function resetForm() {
    setEditingId(null);
    setFormError(null);
    setForm({
      sourceName: "",
      amount: "",
      receivedAt: getTodayDateInputValue(),
      categoryId: ""
    });
  }

  async function loadData() {
    setLoading(true);
    try {
      const [incomeData, categoryData] = await Promise.all([fetchIncome(), fetchCategories()]);
      setEntries(incomeData);
      setCategories(categoryData.filter((category) => category.type === "INCOME"));
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

    if (Number(form.amount || "0") <= 0) {
      setFormError("Informe um valor maior que R$ 0,00.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        sourceName: form.sourceName,
        amount: Number(form.amount || "0") / 100,
        receivedAt: new Date(form.receivedAt).toISOString(),
        categoryId: form.categoryId || undefined
      };

      if (editingId) {
        await updateIncome(editingId, payload);
      } else {
        await createIncome(payload);
      }

      resetForm();
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(entry: Income) {
    setEditingId(entry.id);
    setForm({
      sourceName: entry.sourceName,
      amount: String(Math.round(entry.amount * 100)),
      receivedAt: entry.receivedAt.slice(0, 10),
      categoryId: entry.category?.id ?? ""
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja excluir esta receita?")) {
      return;
    }

    await deleteIncome(id);

    if (editingId === id) {
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
        eyebrow="Receitas"
        description="Salário, freelas, vendas e qualquer outro valor recebido podem ser vinculados ao ciclo."
        meta={lastUpdatedText ? <LastUpdatedLabel text={lastUpdatedText} /> : undefined}
        action={<ValueVisibilityToggleButton />}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Panel title={editingId ? "Editar receita" : "Nova receita"} subtitle="Lance a origem e o valor recebido">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field
              label="Origem"
              placeholder="Ex.: Empresa / Freelance"
              value={form.sourceName}
              onChange={(event) => setForm((current) => ({ ...current, sourceName: event.target.value }))}
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Valor"
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={form.amount ? formatCurrencyInput(form.amount) : ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: parseCurrencyInput(event.target.value) }))
                }
                required
              />
              <Field
                label="Data do recebimento"
                type="date"
                value={form.receivedAt}
                onChange={(event) => setForm((current) => ({ ...current, receivedAt: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-200">Categorias rápidas</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => {
                  const { Icon, color } = getIncomeCategoryPresentation(category);
                  const isActive = form.categoryId === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          categoryId: current.categoryId === category.id ? "" : category.id,
                          sourceName: current.sourceName || category.name
                        }))
                      }
                      className={`flex min-h-[116px] flex-col items-center justify-center gap-3 rounded-2xl border px-4 py-4 text-center transition ${
                        isActive
                          ? "border-white/30 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <span
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${color}22`, color }}
                      >
                        {Icon ? <Icon className="h-[18px] w-[18px] stroke-[2.25]" /> : null}
                      </span>
                      <span className="text-sm font-medium leading-tight text-white">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {formError ? <p className="text-sm text-sky-200">{formError}</p> : null}
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar receita"}
            </PrimaryButton>
            {editingId ? (
              <SecondaryButton type="button" onClick={resetForm}>
                Cancelar edição
              </SecondaryButton>
            ) : null}
          </form>
        </Panel>

        <Panel title="Histórico de receitas" subtitle="Entradas registradas no ambiente atual">
          <div className="space-y-3">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <article key={entry.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-white">{entry.sourceName}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        {entry.category ? (
                          <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${getIncomeCategoryPresentation(entry.category).color}22`,
                              color: getIncomeCategoryPresentation(entry.category).color
                            }}
                          >
                            {(() => {
                              const { Icon } = getIncomeCategoryPresentation(entry.category);
                              return Icon ? <Icon className="h-3.5 w-3.5" /> : null;
                            })()}
                            {entry.category.name}
                          </span>
                        ) : (
                          <span>Sem categoria</span>
                        )}
                        <span>{formatDate(entry.receivedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:min-w-[190px] md:justify-end">
                      <div className="text-left md:text-right">
                      <p className="text-lg font-semibold text-sky-300">{formatCurrencyValue(entry.amount)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                          aria-label="Editar receita"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(entry.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200 transition hover:bg-sky-300/20"
                          aria-label="Excluir receita"
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
                title="Nenhuma receita registrada"
                description="Cadastre uma entrada para começar a comparar receitas e despesas do ciclo."
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
