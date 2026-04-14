import { Pencil, Trash2, WalletCards } from "lucide-react";
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
import type { Investment } from "../types/api";
import { investmentTypeMeta } from "../utils/investment-type-meta";
import { formatDate } from "../utils/format";
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

function getCashDisplayValue(item: Investment) {
  return item.netCurrentValue ?? item.currentValue ?? item.amountInvested;
}

export function CashPage() {
  const { formatCurrencyValue } = useValueVisibility();
  const [items, setItems] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    amountInvested: "",
    currentValue: "",
    netCurrentValue: "",
    investedAt: getTodayDateInputValue()
  });

  const cashTotal = useMemo(
    () => items.reduce((sum, item) => sum + getCashDisplayValue(item), 0),
    [items]
  );
  const lastUpdatedText = useMemo(
    () =>
      buildLastUpdatedText(
        "caixa",
        getLatestTimestamp(items.map((item) => item.updatedAt ?? item.createdAt))
      ),
    [items]
  );

  function resetForm() {
    setEditingId(null);
    setFormError(null);
    setForm({
      name: "",
      amountInvested: "",
      currentValue: "",
      netCurrentValue: "",
      investedAt: getTodayDateInputValue()
    });
  }

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchInvestments();
      setItems(data.filter((item) => item.assetType === "CASH_RESERVE"));
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
      setFormError("Informe o nome da conta ou posição de caixa.");
      return;
    }

    if (
      Number(form.amountInvested || "0") <= 0 ||
      Number(form.currentValue || "0") <= 0 ||
      Number(form.netCurrentValue || "0") <= 0
    ) {
      setFormError("Preencha valor aplicado, total bruto e total líquido.");
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        await updateInvestment(editingId, {
          amountInvested: Number(form.amountInvested || "0") / 100,
          currentValue: Number(form.currentValue || "0") / 100,
          netCurrentValue: Number(form.netCurrentValue || "0") / 100
        });
      } else {
        await createInvestment({
          name: form.name,
          assetType: "CASH_RESERVE",
          investedAt: new Date(form.investedAt).toISOString(),
          amountInvested: Number(form.amountInvested || "0") / 100,
          currentValue: Number(form.currentValue || "0") / 100,
          netCurrentValue: Number(form.netCurrentValue || "0") / 100
        });
      }

      resetForm();
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item: Investment) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      amountInvested: String(Math.round(item.amountInvested * 100)),
      currentValue: item.currentValue ? String(Math.round(item.currentValue * 100)) : "",
      netCurrentValue: item.netCurrentValue ? String(Math.round(item.netCurrentValue * 100)) : "",
      investedAt: item.investedAt.slice(0, 10)
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja excluir este item de caixa?")) {
      return;
    }

    await deleteInvestment(id);

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
        eyebrow="Caixa"
        description="Registre saldos em conta, reserva imediata, corretora e outros recursos com liquidez imediata."
        meta={lastUpdatedText ? <LastUpdatedLabel text={lastUpdatedText} /> : undefined}
        action={<ValueVisibilityToggleButton />}
      />

      <Panel
        title="Saldo total em caixa"
        subtitle="Soma dos recursos disponíveis com liquidez imediata"
        icon={WalletCards}
        iconColor="#7dd3fc"
        tone="info"
      >
        <p className="text-3xl font-semibold text-white">{formatCurrencyValue(cashTotal)}</p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Panel
          title={editingId ? "Atualizar caixa" : "Novo item de caixa"}
          subtitle="Ideal para saldo em conta, conta remunerada, corretora e reserva"
        >
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field
              label="Nome"
              placeholder="Ex.: Conta corrente Nubank"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              disabled={Boolean(editingId)}
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
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
                label="Data de entrada"
                type="date"
                value={form.investedAt}
                onChange={(event) => setForm((current) => ({ ...current, investedAt: event.target.value }))}
                disabled={Boolean(editingId)}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
            {formError ? <p className="text-sm text-sky-200">{formError}</p> : null}
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : editingId ? "Atualizar caixa" : "Salvar caixa"}
            </PrimaryButton>
            {editingId ? (
              <SecondaryButton type="button" onClick={resetForm}>
                Cancelar edição
              </SecondaryButton>
            ) : null}
          </form>
        </Panel>

        <Panel title="Posições de caixa" subtitle="Recursos com liquidez imediata">
          <div className="space-y-3">
            {items.length > 0 ? (
              items.map((item) => (
                <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${investmentTypeMeta.CASH_RESERVE.color}22`,
                            color: investmentTypeMeta.CASH_RESERVE.color
                          }}
                        >
                          <WalletCards className="h-3.5 w-3.5" />
                          {investmentTypeMeta.CASH_RESERVE.label}
                        </span>
                        <span>{formatDate(item.investedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:min-w-[260px] md:justify-end">
                      <div className="text-left md:text-right">
                        <p className="text-sm text-slate-400">
                          Aplicado: <span className="font-medium text-white">{formatCurrencyValue(item.amountInvested)}</span>
                        </p>
                        <p className="text-sm text-slate-400">
                          Bruto: <span className="font-medium text-white">{formatCurrencyValue(item.currentValue ?? item.amountInvested)}</span>
                        </p>
                        <p className="text-lg font-semibold text-sky-300">
                          Líquido: {formatCurrencyValue(item.netCurrentValue ?? item.currentValue ?? item.amountInvested)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                          aria-label="Editar caixa"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200 transition hover:bg-sky-300/20"
                          aria-label="Excluir caixa"
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
                title="Nenhum item de caixa cadastrado"
                description="Cadastre saldos em conta ou reservas para acompanhar sua liquidez."
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
