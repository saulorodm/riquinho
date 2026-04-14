const enumLabelMap: Record<string, string> = {
  PIX: "Pix",
  DEBIT_CARD: "Cartão de débito",
  CREDIT_CARD_FULL: "Cartão de crédito à vista",
  CREDIT_CARD_INSTALLMENTS: "Cartão de crédito parcelado",
  STOCKS_ETFS: "Ações / ETFs",
  REITS_FIIS: "FIIs / REITs",
  FIXED_INCOME: "Renda fixa",
  CASH_RESERVE: "Caixa e liquidez",
  CRYPTO: "Cripto",
  OTHER: "Outros",
  VEHICLE: "Veículo",
  RESIDENCE: "Residência",
  INCOME_PROPERTY: "Imóvel para renda",
  LAND: "Terreno",
  BUSINESS_EQUITY: "Participação"
  ,
  FGTS: "FGTS"
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatEnumLabel(value: string) {
  if (enumLabelMap[value]) {
    return enumLabelMap[value];
  }

  return value
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}
