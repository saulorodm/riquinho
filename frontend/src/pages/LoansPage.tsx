import { Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "../components/EmptyState";
import { Field } from "../components/Field";
import { LastUpdatedLabel } from "../components/LastUpdatedLabel";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionHeader } from "../components/SectionHeader";
import { ValueVisibilityToggleButton } from "../components/ValueVisibilityToggleButton";
import { useValueVisibility } from "../contexts/value-visibility-context";
import {
  createLoan,
  deleteLoan,
  fetchLoans,
  updateLoanInstallmentStatus
} from "../services/queries";
import type { Loan } from "../types/api";
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

function getSafeLoanFirstInstallmentDate(loan: Loan) {
  return loan.firstInstallmentDate ?? loan.installments[0]?.dueDate ?? loan.startDate;
}

export function LoansPage() {
  const { formatCurrencyValue } = useValueVisibility();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [openLoanIds, setOpenLoanIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    borrowerName: "",
    principalAmount: "",
    dueDay: "",
    startDate: getTodayDateInputValue(),
    firstInstallmentDate: getTodayDateInputValue(),
    installmentsCount: ""
  });

  const outstandingTotal = useMemo(
    () =>
      loans.reduce(
        (sum, loan) =>
          sum +
          loan.installments
            .filter((installment) => !installment.paidAt)
            .reduce((installmentsSum, installment) => installmentsSum + installment.amount, 0),
        0
      ),
    [loans]
  );
  const lastUpdatedText = useMemo(
    () =>
      buildLastUpdatedText(
        "valores a receber",
        getLatestTimestamp([
          ...loans.map((loan) => loan.updatedAt ?? loan.createdAt),
          ...loans.flatMap((loan) => loan.installments.map((installment) => installment.updatedAt ?? installment.createdAt))
        ])
      ),
    [loans]
  );

  function resetForm() {
    setFormError(null);
    setForm({
      borrowerName: "",
      principalAmount: "",
      dueDay: "",
      startDate: getTodayDateInputValue(),
      firstInstallmentDate: getTodayDateInputValue(),
      installmentsCount: ""
    });
  }

  async function loadData() {
    setLoading(true);
    try {
      setLoans(await fetchLoans());
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

    if (!form.borrowerName.trim()) {
      setFormError("Informe o nome da pessoa.");
      return;
    }

    if (Number(form.principalAmount || "0") <= 0) {
      setFormError("Informe o valor emprestado.");
      return;
    }

    if (Number(form.dueDay || "0") <= 0) {
      setFormError("Informe o dia do pagamento.");
      return;
    }

    if (Number(form.installmentsCount || "0") <= 0) {
      setFormError("Informe o número de parcelas.");
      return;
    }

    if (!form.firstInstallmentDate) {
      setFormError("Informe a data da primeira parcela.");
      return;
    }

    setSubmitting(true);

    try {
      await createLoan({
        borrowerName: form.borrowerName,
        principalAmount: Number(form.principalAmount) / 100,
        dueDay: Number(form.dueDay),
        startDate: new Date(form.startDate).toISOString(),
        firstInstallmentDate: new Date(form.firstInstallmentDate).toISOString(),
        installmentsCount: Number(form.installmentsCount)
      });

      resetForm();
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleInstallment(installmentId: string, isPaid: boolean) {
    const updatedInstallment = await updateLoanInstallmentStatus(installmentId, isPaid);

    setLoans((current) =>
      current.map((loan) => ({
        ...loan,
        installments: loan.installments.map((installment) =>
          installment.id === installmentId
            ? {
                ...installment,
                paidAt: updatedInstallment.paidAt ?? null
              }
            : installment
        )
      }))
    );
  }

  async function handleDelete(loanId: string) {
    if (!window.confirm("Deseja excluir este valor a receber?")) {
      return;
    }

    await deleteLoan(loanId);
    setOpenLoanIds((current) => current.filter((id) => id !== loanId));
    await loadData();
  }

  function toggleLoanOpen(loanId: string) {
    setOpenLoanIds((current) =>
      current.includes(loanId)
        ? current.filter((id) => id !== loanId)
        : [...current, loanId]
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Valores A Receber"
        description="Acompanhe o saldo em aberto de valores emprestados e marque cada parcela paga."
        meta={lastUpdatedText ? <LastUpdatedLabel text={lastUpdatedText} /> : undefined}
        action={<ValueVisibilityToggleButton />}
      />

      <div className="grid gap-4 md:grid-cols-1">
        <Panel title="Saldo a receber" subtitle="Somatório das parcelas ainda em aberto" tone="positive">
          <p className="text-3xl font-semibold text-white">{formatCurrencyValue(outstandingTotal)}</p>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Panel title="Novo valor a receber" subtitle="Cadastre o empréstimo e gere as parcelas automaticamente">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field
              label="Nome da pessoa"
              placeholder="Ex.: João Silva"
              value={form.borrowerName}
              onChange={(event) => setForm((current) => ({ ...current, borrowerName: event.target.value }))}
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Valor total emprestado"
                type="text"
                inputMode="numeric"
                value={form.principalAmount ? formatCurrencyInput(form.principalAmount) : ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, principalAmount: parseCurrencyInput(event.target.value) }))
                }
                required
              />
              <Field
                label="Pagamento todo dia"
                type="number"
                min={1}
                max={31}
                value={form.dueDay}
                onChange={(event) => setForm((current) => ({ ...current, dueDay: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Início do empréstimo"
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                required
              />
              <Field
                label="Primeira parcela"
                type="date"
                value={form.firstInstallmentDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, firstInstallmentDate: event.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-1">
              <Field
                label="Número de parcelas"
                type="number"
                min={1}
                value={form.installmentsCount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, installmentsCount: event.target.value }))
                }
                required
              />
            </div>
            {formError ? <p className="text-sm text-sky-200">{formError}</p> : null}
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar valor a receber"}
            </PrimaryButton>
          </form>
        </Panel>

        <Panel title="Meus valores a receber" subtitle="Marque as parcelas pagas para reduzir o saldo em aberto">
          <div className="space-y-3">
            {loans.length > 0 ? (
              loans.map((loan) => {
                const paidCount = loan.installments.filter((installment) => installment.paidAt).length;
                const remainingBalance = loan.installments
                  .filter((installment) => !installment.paidAt)
                  .reduce((sum, installment) => sum + installment.amount, 0);
                const sortedInstallments = [...loan.installments].sort((left, right) => {
                  if (Boolean(left.paidAt) !== Boolean(right.paidAt)) {
                    return left.paidAt ? 1 : -1;
                  }

                  return left.installmentNumber - right.installmentNumber;
                });
                const isOpen = openLoanIds.includes(loan.id);

                return (
                  <article key={loan.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleLoanOpen(loan.id)}
                        className="flex flex-1 flex-col gap-3 text-left md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-white">{loan.borrowerName}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                            <span>Empréstimo em {formatDate(loan.startDate)}</span>
                            <span>1a parcela em {formatDate(getSafeLoanFirstInstallmentDate(loan))}</span>
                            <span>{loan.installmentsCount} parcelas</span>
                            <span>Dia {loan.dueDay}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 md:min-w-[280px] md:justify-end">
                          <div className="text-left md:text-right">
                            <p className="text-sm text-slate-400">
                              Emprestado: <span className="font-medium text-white">{formatCurrencyValue(loan.principalAmount)}</span>
                            </p>
                            <p className="text-sm text-slate-400">
                              Pago: <span className="font-medium text-white">{paidCount}/{loan.installmentsCount}</span>
                            </p>
                            <p className="text-lg font-semibold text-sky-300">
                              Em aberto: {formatCurrencyValue(remainingBalance)}
                            </p>
                          </div>
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        </div>
                      </button>
                      <div className="pt-0 md:pt-1">
                        <button
                          type="button"
                          onClick={() => void handleDelete(loan.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200 transition hover:bg-sky-300/20"
                          aria-label="Excluir valor a receber"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {isOpen ? (
                      <div className="mt-4 grid gap-3 border-t border-white/10 pt-4">
                        {sortedInstallments.map((installment) => (
                          <button
                            key={installment.id}
                            type="button"
                            onClick={() => void handleToggleInstallment(installment.id, !Boolean(installment.paidAt))}
                            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                              installment.paidAt
                                ? "border-sky-300/20 bg-sky-300/10 text-sky-100"
                                : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium">
                                Parcela {installment.installmentNumber}
                              </p>
                              <p className="text-xs text-slate-400">
                                Vencimento {formatDate(installment.dueDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold">{formatCurrencyValue(installment.amount)}</span>
                              <span
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                                  installment.paidAt
                                    ? "border-sky-300/30 bg-sky-300/20 text-sky-100"
                                    : "border-white/10 bg-white/5 text-slate-300"
                                }`}
                              >
                                <Check className="h-4 w-4" />
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <EmptyState
                title="Nenhum valor a receber cadastrado"
                description="Cadastre o primeiro empréstimo concedido para acompanhar o saldo em aberto."
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
