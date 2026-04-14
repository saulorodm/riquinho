import { Pencil, ShieldEllipsis, Trash2 } from "lucide-react";
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
import { createAsset, deleteAsset, fetchAssets, updateAsset } from "../services/queries";
import type { Asset } from "../types/api";
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

export function FgtsPage() {
  const { formatCurrencyValue } = useValueVisibility();
  const [fgtsEntries, setFgtsEntries] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "FGTS",
    currentValue: "",
    acquiredAt: getTodayDateInputValue()
  });

  const fgtsTotal = useMemo(
    () => fgtsEntries.reduce((sum, item) => sum + item.currentValue, 0),
    [fgtsEntries]
  );
  const lastUpdatedText = useMemo(
    () =>
      buildLastUpdatedText(
        "FGTS",
        getLatestTimestamp(fgtsEntries.map((entry) => entry.updatedAt ?? entry.createdAt))
      ),
    [fgtsEntries]
  );

  function resetForm() {
    setEditingId(null);
    setFormError(null);
    setForm({
      name: "FGTS",
      currentValue: "",
      acquiredAt: getTodayDateInputValue()
    });
  }

  async function loadData() {
    setLoading(true);
    try {
      const assetsData = await fetchAssets();
      setFgtsEntries(assetsData.filter((asset) => asset.category === "FGTS"));
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
      setFormError("Informe o nome da posição de FGTS.");
      return;
    }

    if (Number(form.currentValue || "0") <= 0) {
      setFormError("Informe um valor atual maior que R$ 0,00.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        category: "FGTS",
        currentValue: Number(form.currentValue) / 100,
        acquiredAt: new Date(form.acquiredAt).toISOString()
      };

      if (editingId) {
        await updateAsset(editingId, payload);
      } else {
        await createAsset(payload);
      }

      resetForm();
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(entry: Asset) {
    setEditingId(entry.id);
    setForm({
      name: entry.name,
      currentValue: String(Math.round(entry.currentValue * 100)),
      acquiredAt: entry.acquiredAt.slice(0, 10)
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja excluir este registro de FGTS?")) {
      return;
    }

    await deleteAsset(id);

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
        eyebrow="FGTS"
        description="Acompanhe o valor acumulado do FGTS em uma área própria, separada dos demais bens patrimoniais."
        meta={lastUpdatedText ? <LastUpdatedLabel text={lastUpdatedText} /> : undefined}
        action={<ValueVisibilityToggleButton />}
      />

      <Panel title="Total em FGTS" subtitle="Somatório das posições registradas" icon={ShieldEllipsis} iconColor="#22c55e" tone="positive">
        <p className="text-3xl font-semibold text-white">{formatCurrencyValue(fgtsTotal)}</p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Panel title={editingId ? "Editar FGTS" : "Novo registro de FGTS"} subtitle="Use essa área para atualizar o saldo acumulado">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field
              label="Nome"
              placeholder="Ex.: FGTS Caixa"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Valor atual"
                type="text"
                inputMode="numeric"
                value={form.currentValue ? formatCurrencyInput(form.currentValue) : ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currentValue: parseCurrencyInput(event.target.value) }))
                }
                required
              />
              <Field
                label="Data de referência"
                type="date"
                value={form.acquiredAt}
                onChange={(event) => setForm((current) => ({ ...current, acquiredAt: event.target.value }))}
                required
              />
            </div>
            {formError ? <p className="text-sm text-sky-200">{formError}</p> : null}
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar FGTS"}
            </PrimaryButton>
            {editingId ? (
              <SecondaryButton type="button" onClick={resetForm}>
                Cancelar edição
              </SecondaryButton>
            ) : null}
          </form>
        </Panel>

        <Panel title="Histórico de FGTS" subtitle="Registros salvos nessa área própria">
          <div className="space-y-3">
            {fgtsEntries.length > 0 ? (
              fgtsEntries.map((entry) => (
                <article key={entry.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-white">{entry.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-2 rounded-full bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-200">
                          <ShieldEllipsis className="h-3.5 w-3.5" />
                          FGTS
                        </span>
                        <span>{formatDate(entry.acquiredAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:min-w-[260px] md:justify-end">
                      <p className="text-lg font-semibold text-sky-200">
                        {formatCurrencyValue(entry.currentValue)}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                          aria-label="Editar FGTS"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(entry.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200 transition hover:bg-sky-300/20"
                          aria-label="Excluir FGTS"
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
                title="Nenhum saldo de FGTS registrado"
                description="Cadastre o seu saldo atual de FGTS para acompanhar essa reserva em uma área separada."
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
