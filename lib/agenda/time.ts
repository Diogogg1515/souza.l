// Todos os horários da agenda são tratados no fuso de Brasília.
// O Brasil não usa horário de verão desde 2019, então o fuso é sempre UTC-3.
export const TIME_ZONE = "America/Sao_Paulo";
const OFFSET = "-03:00";

const DAY_FORMAT = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const INPUT_FORMAT = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const TIME_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const LABEL_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

// "2026-10-03T15:00" (campo de data e hora do formulário) -> data real
export function parseLocalDateTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}:00${OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// data real -> "2026-10-03T15:00" (para preencher o formulário)
export function toInputValue(iso: string): string {
  return INPUT_FORMAT.format(new Date(iso)).replace(" ", "T");
}

// Dia no fuso de Brasília: "2026-10-03"
export function dayKey(value: string | number | Date): string {
  return DAY_FORMAT.format(new Date(value));
}

// "15:00"
export function formatTime(iso: string): string {
  return TIME_FORMAT.format(new Date(iso));
}

// "Hoje", "Amanhã" ou "sáb., 3 de out."
export function formatDayLabel(key: string): string {
  const today = dayKey(Date.now());
  const tomorrow = dayKey(Date.now() + 24 * 60 * 60 * 1000);
  if (key === today) return "Hoje";
  if (key === tomorrow) return "Amanhã";
  return LABEL_FORMAT.format(new Date(`${key}T12:00:00${OFFSET}`));
}
