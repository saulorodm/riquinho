import { Landmark, Pencil, Trash2 } from "lucide-react";
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
  createAsset,
  deleteAsset,
  fetchAssets,
  updateAsset
} from "../services/queries";
import type { Asset, AssetCategory } from "../types/api";
import { assetCategoryMeta } from "../utils/asset-category-meta";
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

export function AssetsPage() {
  const { formatCurrencyValue } = useValueVisibility();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    category: AssetCategory;
    acquisitionValue: string;
    currentValue: string;
    acquiredAt: string;
  }>({
    name: "",
    category: "VEHICLE",
    acquisitionValue: "",
    currentValue: "",
    acquiredAt: getTodayDateInputValue()
  });

  const assetsTotal = useMemo(
    () => assets.reduce((sum, item) => sum + item.currentValue, 0),
    [assets]
  );
  const lastUpdatedText = useMemo(
    () =>
      buildLastUpdatedText(
        "patrimônio",
        getLatestTimestamp(assets.map((asset) => asset.updatedAt ?? asset.createdAt))
      ),
    [assets]
  );

  function resetForm() {
    setEditingId(null);
    setFormError(null);
    setForm({
      name: "",
      category: "VEHICLE",
      acquisitionValue: "",
      currentValue: "",
      acquiredAt: getTodayDateInputValue()
    });
  }

  async function loadData() {
    setLoading(true);
    try {
      const assetsData = await fetchAssets();
      setAssets(assetsData.filter((asset) => asset.category !== "FGTS"));
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
      setFormError("Informe o nome do patrimônio.");
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
        category: form.category,
        acquisitionValue: form.acquisitionValue ? Number(form.acquisitionValue) / 100 : undefined,
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

  function handleEdit(asset: Asset) {
    setEditingId(asset.id);
    setForm({
      name: asset.name,
      category: asset.category,
      acquisitionValue: asset.acquisitionValue ? String(Math.round(asset.acquisitionValue * 100)) : "",
      currentValue: String(Math.round(asset.currentValue * 100)),
      acquiredAt: asset.acquiredAt.slice(0, 10)
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja excluir este patrimônio?")) {
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
        eyebrow="Patrimônio"
        description="Cadastre veículos, imóveis e outros bens. A visão consolidada do patrimônio total fica no Dashboard."
        meta={lastUpdatedText ? <LastUpdatedLabel text={lastUpdatedText} /> : undefined}
        action={<ValueVisibilityToggleButton />}
      />

      <div className="grid gap-4 md:grid-cols-1">
        <Panel
          title="Bens patrimoniais"
          subtitle="Somatório dos bens cadastrados"
          icon={Landmark}
          iconColor="#7dd3fc"
          tone="patrimonial"
        >
          <p className="text-3xl font-semibold text-white">{formatCurrencyValue(assetsTotal)}</p>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Panel
          title={editingId ? "Editar patrimônio" : "Novo patrimônio"}
          subtitle="Cadastre veículos, imóveis e outros bens patrimoniais"
        >
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field
              label="Nome do patrimônio"
              placeholder="Ex.: Apartamento Moema"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-200">Categorias rápidas</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(Object.keys(assetCategoryMeta) as AssetCategory[])
                  .filter((category) => category !== "FGTS")
                  .map((category) => {
                  const meta = assetCategoryMeta[category];
                  const Icon = meta.icon;
                  const isActive = form.category === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, category }))}
                      className={`flex min-h-[116px] flex-col items-center justify-center gap-3 rounded-2xl border px-4 py-4 text-center transition ${
                        isActive
                          ? "border-white/30 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
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
                label="Valor de aquisição"
                type="text"
                inputMode="numeric"
                value={form.acquisitionValue ? formatCurrencyInput(form.acquisitionValue) : ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, acquisitionValue: parseCurrencyInput(event.target.value) }))
                }
                disabled={Boolean(editingId)}
              />
            </div>
            <Field
              label="Data de aquisição"
              type="date"
              value={form.acquiredAt}
              onChange={(event) => setForm((current) => ({ ...current, acquiredAt: event.target.value }))}
              required
            />
            {formError ? <p className="text-sm text-sky-200">{formError}</p> : null}
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar patrimônio"}
            </PrimaryButton>
            {editingId ? (
              <SecondaryButton type="button" onClick={resetForm}>
                Cancelar edição
              </SecondaryButton>
            ) : null}
          </form>
        </Panel>

        <Panel title="Meus patrimônios" subtitle="Bens cadastrados separadamente dos investimentos">
          <div className="space-y-3">
            {assets.length > 0 ? (
              assets.map((asset) => {
                const meta = assetCategoryMeta[asset.category];
                const Icon = meta.icon;

                return (
                  <article key={asset.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-white">{asset.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                          <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                            style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {meta.label}
                          </span>
                          <span>{formatDate(asset.acquiredAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 md:min-w-[260px] md:justify-end">
                        <div className="text-left md:text-right">
                          {asset.acquisitionValue ? (
                            <p className="text-sm text-slate-400">
                              Aquisição: <span className="font-medium text-white">{formatCurrencyValue(asset.acquisitionValue)}</span>
                            </p>
                          ) : null}
                          <p className="text-lg font-semibold text-sky-300">
                            Atual: {formatCurrencyValue(asset.currentValue)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(asset)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                            aria-label="Editar patrimônio"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(asset.id)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200 transition hover:bg-sky-300/20"
                            aria-label="Excluir patrimônio"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyState
                title="Nenhum patrimônio cadastrado"
                description="Cadastre veículos, imóveis ou participações para acompanhar seu patrimônio total."
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
