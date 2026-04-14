import { formatDateTime } from "./format";

export function getLatestTimestamp(values: Array<string | null | undefined>) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

export function buildLastUpdatedText(context: string, value?: string | null) {
  if (!value) {
    return null;
  }

  return `Última atualização de ${context} em ${formatDateTime(value)}`;
}
