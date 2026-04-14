import { BriefcaseBusiness, Landmark, Pencil, Sparkles, Trash2 } from "lucide-react";
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
import { SelectField } from "../components/SelectField";
import {
  createExpense,
  deleteExpense,
  fetchCategories,
  fetchExpenses,
  updateExpense
} from "../services/queries";
import type { Category, Expense, ExpenseKind, PaymentMethod } from "../types/api";
import { categoryIconMap } from "../utils/category-icon-registry";
import { expenseCategoryMeta } from "../utils/expense-category-meta";
import { formatCurrency, formatDate, formatEnumLabel } from "../utils/format";
import { buildLastUpdatedText, getLatestTimestamp } from "../utils/last-updated";

const paymentMethods: Array<{ label: string; value: PaymentMethod }> = [
  { label: "Pix", value: "PIX" },
  { label: "Cartão de débito", value: "DEBIT_CARD" },
  { label: "Cartão crédito à vista", value: "CREDIT_CARD_FULL" },
  { label: "Cartão crédito parcelado", value: "CREDIT_CARD_INSTALLMENTS" }
];

const expenseKindOptions: Array<{
  label: string;
  value: ExpenseKind;
  hint: string;
  icon: typeof BriefcaseBusiness;
}> = [
  {
    label: "Operacional",
    value: "OPERATIONAL",
    hint: "Rotina e disciplina do mês",
    icon: BriefcaseBusiness
  },
  {
    label: "Extraordinário",
    value: "EXTRAORDINARY",
    hint: "Decisão pontual fora da rotina",
    icon: Sparkles
  },
  {
    label: "Patrimonial",
    value: "PATRIMONIAL",
    hint: "Compromisso ligado à formação de patrimônio",
    icon: Landmark
  }
];

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

function getExpenseCategoryPresentation(category: Category) {
  const fallbackMeta = expenseCategoryMeta[category.name];
  const color = category.color ?? fallbackMeta?.color ?? "#7dd3fc";
  const Icon = (category.icon ? categoryIconMap[category.icon] : undefined) ?? fallbackMeta?.icon;

  return {
    color,
    Icon
  };
}

export function ExpensesPage() {
  const { formatCurrencyValue } = useValueVisibility();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    expenseKind: "OPERATIONAL",
    isRecurring: false,
    categoryId: "",
    purchaseDate: getTodayDateInputValue(),
    paymentMethod: "PIX",
    installmentsCount: "1"
  });
  const isInstallmentPayment = form.paymentMethod === "CREDIT_CARD_INSTALLMENTS";
  const lastUpdatedText = useMemo(
    () =>
      buildLastUpdatedText(
        "despesas",
        getLatestTimestamp(expenses.map((expense) => expense.updatedAt ?? expense.createdAt))
      ),
    [expenses]
  );

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      amount: "",
      expenseKind: "OPERATIONAL",
      isRecurring: false,
      categoryId: "",
      purchaseDate: getTodayDateInputValue(),
      paymentMethod: "PIX",
      installmentsCount: "1"
    });
  }

  async function loadData() {
    setLoading(true);
    try {
      const [expenseData, categoryData] = await Promise.all([fetchExpenses(), fetchCategories()]);
      setExpenses(expenseData);
      setCategories(categoryData.filter((category) => category.type === "EXPENSE"));
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
        title: form.title,
        amount: Number(form.amount || "0") / 100,
        expenseKind: form.expenseKind,
        isRecurring: form.isRecurring,
        categoryId: form.categoryId || undefined,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
        paymentMethod: form.paymentMethod,
        installmentsCount: Number(form.installmentsCount)
      };

      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }

      resetForm();

      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      amount: String(Math.round(expense.amount * 100)),
      expenseKind: expense.expenseKind,
      isRecurring: Boolean(expense.isRecurring),
      categoryId: expense.category?.id ?? "",
      purchaseDate: expense.purchaseDate.slice(0, 10),
      paymentMethod: expense.paymentMethod,
      installmentsCount: String(expense.installmentsCount)
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja excluir esta despesa?")) {
      return;
    }

    await deleteExpense(id);

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
        eyebrow="Despesas"
        description="Registre despesas com foco no ciclo financeiro e com suporte nativo a compras parceladas."
        meta={lastUpdatedText ? <LastUpdatedLabel text={lastUpdatedText} /> : undefined}
        action={<ValueVisibilityToggleButton />}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Panel
          title={editingId ? "Editar despesa" : "Nova despesa"}
          subtitle="Cada compra pode gerar parcelas mensais automaticamente"
        >
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field
              label="Título"
              placeholder="Ex.: Jogo do PS5"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-200">Tipo de despesa</p>
              <div className="grid gap-3">
                {expenseKindOptions.map((option) => {
                  const isActive = form.expenseKind === option.value;
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, expenseKind: option.value }))}
                        className={`flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                          isActive
                          ? "border-sky-300/30 bg-sky-300/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <span
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-300/12 text-sky-200"
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <div className="min-w-0">
                        <p className="font-medium text-white">{option.label}</p>
                        <p className="mt-1 text-sm text-slate-400">{option.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Valor total"
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={form.amount ? formatCurrencyInput(form.amount) : ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: parseCurrencyInput(event.target.value)
                  }))
                }
                required
              />
              <Field
                label="Data da compra"
                type="date"
                value={form.purchaseDate}
                onChange={(event) => setForm((current) => ({ ...current, purchaseDate: event.target.value }))}
                required
              />
            </div>
            <SelectField
              label="Forma de pagamento"
              value={form.paymentMethod}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                setForm((current) => ({
                  ...current,
                  paymentMethod: event.target.value,
                  installmentsCount:
                    event.target.value === "CREDIT_CARD_INSTALLMENTS"
                      ? current.installmentsCount === "1"
                        ? "2"
                        : current.installmentsCount
                      : "1"
                }))
              }
              options={paymentMethods}
            />
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isRecurring: event.target.checked
                  }))
                }
                className="h-4 w-4 rounded border-white/20 bg-transparent text-sky-300"
              />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-white">Gasto recorrente</p>
                <p className="text-xs text-slate-400">
                  Marque para seguro, Netflix, academia e outros lançamentos que se repetem ao longo do tempo.
                </p>
              </div>
            </label>
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-200">Categorias rápidas</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => {
                  const { Icon, color } = getExpenseCategoryPresentation(category);
                  const isActive = form.categoryId === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          categoryId: current.categoryId === category.id ? "" : category.id
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
                      <span className="text-sm font-medium leading-tight text-white">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {isInstallmentPayment ? (
              <Field
                label="Quantidade de parcelas"
                type="number"
                min="2"
                max="24"
                value={form.installmentsCount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, installmentsCount: event.target.value }))
                }
                hint="O backend distribui automaticamente as parcelas pelos próximos ciclos."
              />
            ) : null}
            {formError ? <p className="text-sm text-sky-200">{formError}</p> : null}
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar despesa"}
            </PrimaryButton>
            {editingId ? (
              <SecondaryButton type="button" onClick={resetForm}>
                Cancelar edição
              </SecondaryButton>
            ) : null}
          </form>
        </Panel>

        <Panel title="Últimos lançamentos" subtitle="Lista completa das despesas registradas">
          <div className="space-y-3">
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <article key={expense.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-white">{expense.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        {expense.category ? (
                          <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${getExpenseCategoryPresentation(expense.category).color}22`,
                              color: getExpenseCategoryPresentation(expense.category).color
                            }}
                          >
                            {(() => {
                              const { Icon } = getExpenseCategoryPresentation(expense.category);
                              return Icon ? <Icon className="h-3.5 w-3.5" /> : null;
                            })()}
                            {expense.category.name}
                          </span>
                        ) : (
                          <span>Sem categoria</span>
                        )}
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            "border border-sky-300/20 bg-sky-300/10 text-sky-200"
                          }`}
                        >
                          {expense.expenseKind === "OPERATIONAL"
                            ? "Operacional"
                            : expense.expenseKind === "EXTRAORDINARY"
                              ? "Extraordinário"
                              : "Patrimonial"}
                        </span>
                        <span>{formatDate(expense.purchaseDate)}</span>
                        <span>{formatEnumLabel(expense.paymentMethod)}</span>
                        {expense.isRecurring ? (
                          <span className="inline-flex items-center rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-200">
                            Recorrente
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:min-w-[190px] md:justify-end">
                      <div className="text-left md:text-right">
                      <p className="text-lg font-semibold text-white">{formatCurrencyValue(expense.amount)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(expense)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                          aria-label="Editar despesa"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(expense.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200 transition hover:bg-sky-300/20"
                          aria-label="Excluir despesa"
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
                title="Nenhuma despesa registrada"
                description="Use o formulário ao lado para lançar a primeira despesa do ciclo."
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
