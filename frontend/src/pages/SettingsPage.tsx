import { CalendarRange, PencilRuler, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Field } from "../components/Field";
import { LastUpdatedLabel } from "../components/LastUpdatedLabel";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { SectionHeader } from "../components/SectionHeader";
import { SelectField } from "../components/SelectField";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchSettings,
  updateCategory,
  updateSettings
} from "../services/queries";
import type { AppSettings, Category, CategoryType } from "../types/api";
import { categoryIconMap, categoryIconOptions } from "../utils/category-icon-registry";
import { buildLastUpdatedText, getLatestTimestamp } from "../utils/last-updated";

const MAX_QUICK_CATEGORIES = 6;

interface EditableCategory extends Category {
  localId: string;
}

const expenseCategorySeed: Array<Pick<EditableCategory, "name" | "color" | "icon" | "budgetCeiling">> = [
  { name: "Lazer", color: "#f472b6", icon: "sparkles", budgetCeiling: 0 },
  { name: "Assinaturas", color: "#a78bfa", icon: "tv", budgetCeiling: 0 },
  { name: "Carro", color: "#f59e0b", icon: "car", budgetCeiling: 0 },
  { name: "Saúde", color: "#34d399", icon: "heart", budgetCeiling: 0 },
  { name: "Compras", color: "#60a5fa", icon: "shopping-bag", budgetCeiling: 0 },
  { name: "Casa", color: "#7dd3fc", icon: "home", budgetCeiling: 0 }
];

const incomeCategorySeed: Array<Pick<EditableCategory, "name" | "color" | "icon">> = [
  { name: "Salario CLT", color: "#60a5fa", icon: "briefcase" },
  { name: "Propriedade Intelectual", color: "#f59e0b", icon: "copyright" },
  { name: "13%", color: "#34d399", icon: "coins" },
  { name: "Férias Adiantadas", color: "#a78bfa", icon: "umbrella" },
  { name: "Freelance", color: "#7dd3fc", icon: "laptop" },
  { name: "Dividendos", color: "#facc15", icon: "piggy-bank" }
];

function toEditableCategory(
  category: Pick<EditableCategory, "id" | "name" | "type" | "color" | "icon" | "budgetCeiling">,
  index: number
) {
  return {
    ...category,
    localId: category.id ?? `temp-${category.type.toLowerCase()}-${index + 1}`
  };
}

function buildSeedCategory(
  type: Extract<CategoryType, "EXPENSE" | "INCOME">,
  index: number
): EditableCategory {
  const expenseSeed = expenseCategorySeed[index];
  const incomeSeed = incomeCategorySeed[index];

  return {
    id: "",
    localId: `temp-${type.toLowerCase()}-${Date.now()}-${index}`,
    type,
    name: (type === "EXPENSE" ? expenseSeed?.name : incomeSeed?.name) ?? "",
    color: (type === "EXPENSE" ? expenseSeed?.color : incomeSeed?.color) ?? "#7dd3fc",
    icon: (type === "EXPENSE" ? expenseSeed?.icon : incomeSeed?.icon) ?? "sparkles",
    budgetCeiling: type === "EXPENSE" ? expenseSeed?.budgetCeiling ?? 0 : null
  };
}

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

function normalizeCurrencyToNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  const raw = String(value ?? "").trim();

  if (!raw) {
    return 0;
  }

  return Number(raw) / 100;
}

function prepareCategories(
  categories: Category[],
  type: Extract<CategoryType, "EXPENSE" | "INCOME">
) {
  const filtered = categories.filter((category) => category.type === type).slice(0, MAX_QUICK_CATEGORIES);

  if (filtered.length > 0) {
    return filtered.map((category, index) => toEditableCategory(category, index));
  }

  if (type === "EXPENSE") {
    return expenseCategorySeed.map((category, index) =>
      toEditableCategory(
        {
          id: "",
          type,
          name: category.name,
          color: category.color,
          icon: category.icon,
          budgetCeiling: category.budgetCeiling ?? 0
        },
        index
      )
    );
  }

  return incomeCategorySeed.map((category, index) =>
    toEditableCategory(
      {
        id: "",
        type,
        name: category.name,
        color: category.color,
        icon: category.icon,
        budgetCeiling: null
      },
      index
    )
  );
}

function CategoryEditorCard({
  category,
  type,
  saving,
  onChange,
  onSave,
  onDelete
}: {
  category: EditableCategory;
  type: Extract<CategoryType, "EXPENSE" | "INCOME">;
  saving: boolean;
  onChange: (localId: string, field: keyof EditableCategory, value: string | number | null) => void;
  onSave: (category: EditableCategory) => Promise<void>;
  onDelete: (category: EditableCategory) => Promise<void>;
}) {
  const Icon = (category.icon ? categoryIconMap[category.icon] : undefined) ?? categoryIconOptions[0].icon;

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${category.color ?? "#7dd3fc"}22`, color: category.color ?? "#7dd3fc" }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{category.name || "Nova categoria"}</p>
            <p className="text-xs text-slate-400">
              {type === "EXPENSE" ? "Categoria rápida de despesa" : "Categoria rápida de receita"}
            </p>
          </div>
        </div>
        <div
          className="h-10 w-10 rounded-2xl border border-white/10"
          style={{ backgroundColor: category.color ?? "#7dd3fc" }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nome"
          value={category.name}
          onChange={(event) => onChange(category.localId, "name", event.target.value)}
          placeholder="Nome da categoria"
          required
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <SelectField
            label="Ícone"
            value={category.icon ?? categoryIconOptions[0].value}
            onChange={(event) => onChange(category.localId, "icon", event.target.value)}
            options={categoryIconOptions.map((option) => ({
              label: option.label,
              value: option.value
            }))}
          />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Cor</span>
            <div className="flex h-[50px] items-center justify-center rounded-2xl border border-white/10 bg-ink/80 px-3">
              <input
                type="color"
                value={category.color ?? "#7dd3fc"}
                onChange={(event) => onChange(category.localId, "color", event.target.value)}
                className="h-9 w-full cursor-pointer rounded-xl border-0 bg-transparent p-0"
              />
            </div>
          </label>
        </div>
      </div>

      {type === "EXPENSE" ? (
        <div className="mt-4">
          <Field
            label="Limite mensal"
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={formatCurrencyInput(String(Math.round(normalizeCurrencyToNumber(category.budgetCeiling) * 100)))}
            onChange={(event) =>
              onChange(
                category.localId,
                "budgetCeiling",
                Number(parseCurrencyInput(event.target.value) || "0") / 100
              )
            }
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <PrimaryButton type="button" disabled={saving} onClick={() => void onSave(category)}>
          {saving ? "Salvando..." : "Salvar categoria"}
        </PrimaryButton>
        <SecondaryButton type="button" disabled={saving} onClick={() => void onDelete(category)}>
          Excluir
        </SecondaryButton>
      </div>
    </article>
  );
}

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settingsUpdatedAt, setSettingsUpdatedAt] = useState<string | null>(null);
  const [savingCycle, setSavingCycle] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    cycleStartDay: "21",
    cycleEndDay: "20"
  });
  const [expenseCategories, setExpenseCategories] = useState<EditableCategory[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<EditableCategory[]>([]);
  const [savingCategoryKey, setSavingCategoryKey] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);

    try {
      const [settings, categories] = await Promise.all([fetchSettings(), fetchCategories()]);

      setCycleForm({
        cycleStartDay: String(settings.cycleStartDay ?? 21),
        cycleEndDay: String(settings.cycleEndDay ?? 20)
      });
      setSettingsUpdatedAt(settings.updatedAt ?? null);
      setExpenseCategories(prepareCategories(categories, "EXPENSE"));
      setIncomeCategories(prepareCategories(categories, "INCOME"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const cycleSummary = useMemo(
    () => `${cycleForm.cycleStartDay || "--"} até ${cycleForm.cycleEndDay || "--"}`,
    [cycleForm.cycleEndDay, cycleForm.cycleStartDay]
  );
  const lastUpdatedText = useMemo(
    () =>
      buildLastUpdatedText(
        "configurações",
        getLatestTimestamp([
          settingsUpdatedAt,
          ...expenseCategories.map((category) => category.updatedAt ?? category.createdAt),
          ...incomeCategories.map((category) => category.updatedAt ?? category.createdAt)
        ])
      ),
    [expenseCategories, incomeCategories, settingsUpdatedAt]
  );

  function updateCategoryList(
    type: Extract<CategoryType, "EXPENSE" | "INCOME">,
    updater: (current: EditableCategory[]) => EditableCategory[]
  ) {
    if (type === "EXPENSE") {
      setExpenseCategories(updater);
      return;
    }

    setIncomeCategories(updater);
  }

  function handleCategoryChange(
    type: Extract<CategoryType, "EXPENSE" | "INCOME">,
    localId: string,
    field: keyof EditableCategory,
    value: string | number | null
  ) {
    updateCategoryList(type, (current) =>
      current.map((category) =>
        category.localId === localId
          ? {
              ...category,
              [field]: value
            }
          : category
      )
    );
  }

  function handleAddCategory(type: Extract<CategoryType, "EXPENSE" | "INCOME">) {
    updateCategoryList(type, (current) => {
      if (current.length >= MAX_QUICK_CATEGORIES) {
        return current;
      }

      return [...current, buildSeedCategory(type, current.length)];
    });
  }

  async function handleSaveCycle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingCycle(true);

    try {
      const updated = await updateSettings({
        cycleStartDay: Number(cycleForm.cycleStartDay),
        cycleEndDay: Number(cycleForm.cycleEndDay)
      }) as AppSettings;

      setCycleForm({
        cycleStartDay: String(updated.cycleStartDay ?? 21),
        cycleEndDay: String(updated.cycleEndDay ?? 20)
      });
      setSettingsUpdatedAt(updated.updatedAt ?? null);
    } finally {
      setSavingCycle(false);
    }
  }

  async function handleSaveCategory(category: EditableCategory) {
    const categoryKey = category.id || category.localId;
    setSavingCategoryKey(categoryKey);

    try {
      const payload = {
        name: category.name.trim(),
        type: category.type,
        color: category.color ?? undefined,
        icon: category.icon ?? undefined,
        budgetCeiling:
          category.type === "EXPENSE" ? normalizeCurrencyToNumber(category.budgetCeiling) : undefined
      };

      const savedCategory = category.id
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);

      updateCategoryList(category.type as Extract<CategoryType, "EXPENSE" | "INCOME">, (current) =>
        current.map((item) =>
          item.localId === category.localId
            ? toEditableCategory(
                {
                  ...savedCategory,
                  budgetCeiling:
                    category.type === "EXPENSE"
                      ? normalizeCurrencyToNumber(savedCategory.budgetCeiling)
                      : savedCategory.budgetCeiling
                },
                current.findIndex((candidate) => candidate.localId === category.localId)
              )
            : item
        )
      );
    } finally {
      setSavingCategoryKey(null);
    }
  }

  async function handleDeleteCategory(category: EditableCategory) {
    if (category.id && !window.confirm("Deseja excluir esta categoria?")) {
      return;
    }

    const categoryKey = category.id || category.localId;
    setSavingCategoryKey(categoryKey);

    try {
      if (category.id) {
        await deleteCategory(category.id);
      }

      updateCategoryList(category.type as Extract<CategoryType, "EXPENSE" | "INCOME">, (current) =>
        current.filter((item) => item.localId !== category.localId)
      );
    } finally {
      setSavingCategoryKey(null);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Configurações"
        description="Ajuste seu ciclo mensal, despesas e receitas."
        meta={lastUpdatedText ? <LastUpdatedLabel text={lastUpdatedText} /> : undefined}
      />

      <Panel title="Ciclo Mensal" icon={CalendarRange} iconColor="#7dd3fc" tone="info">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={handleSaveCycle}>
          <Field
            label="Dia de início"
            type="number"
            min="1"
            max="31"
            value={cycleForm.cycleStartDay}
            onChange={(event) => setCycleForm((current) => ({ ...current, cycleStartDay: event.target.value }))}
            required
          />
          <Field
            label="Dia de fim"
            type="number"
            min="1"
            max="31"
            value={cycleForm.cycleEndDay}
            onChange={(event) => setCycleForm((current) => ({ ...current, cycleEndDay: event.target.value }))}
            required
          />
          <PrimaryButton type="submit" disabled={savingCycle}>
            {savingCycle ? "Salvando..." : "Salvar ciclo"}
          </PrimaryButton>
        </form>

        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Ciclo atual configurado: <span className="font-semibold text-white">{cycleSummary}</span>
        </div>
      </Panel>

      <Panel
        title="Despesas"
        subtitle={`Categorias rápidas e limite mensal por categoria (${expenseCategories.length}/${MAX_QUICK_CATEGORIES})`}
        icon={WalletCards}
        iconColor="#f472b6"
        tone="warning"
      >
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {expenseCategories.map((category) => (
              <CategoryEditorCard
                key={category.localId}
                category={category}
                type="EXPENSE"
                saving={savingCategoryKey === (category.id || category.localId)}
                onChange={(localId, field, value) => handleCategoryChange("EXPENSE", localId, field, value)}
                onSave={handleSaveCategory}
                onDelete={handleDeleteCategory}
              />
            ))}
          </div>

          {expenseCategories.length < MAX_QUICK_CATEGORIES ? (
            <SecondaryButton type="button" onClick={() => handleAddCategory("EXPENSE")}>
              Adicionar categoria de despesa
            </SecondaryButton>
          ) : null}
        </div>
      </Panel>

      <Panel
        title="Receitas"
        subtitle={`Categorias rápidas personalizadas (${incomeCategories.length}/${MAX_QUICK_CATEGORIES})`}
        icon={PencilRuler}
        iconColor="#34d399"
        tone="positive"
      >
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {incomeCategories.map((category) => (
              <CategoryEditorCard
                key={category.localId}
                category={category}
                type="INCOME"
                saving={savingCategoryKey === (category.id || category.localId)}
                onChange={(localId, field, value) => handleCategoryChange("INCOME", localId, field, value)}
                onSave={handleSaveCategory}
                onDelete={handleDeleteCategory}
              />
            ))}
          </div>

          {incomeCategories.length < MAX_QUICK_CATEGORIES ? (
            <SecondaryButton type="button" onClick={() => handleAddCategory("INCOME")}>
              Adicionar categoria de receita
            </SecondaryButton>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
