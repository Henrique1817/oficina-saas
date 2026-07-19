/** Limites do dia civil em America/Sao_Paulo (sem horário de verão desde 2019). */
export function saoPauloDayRange(ref: Date = new Date()) {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ref);

  const start = new Date(`${ymd}T00:00:00-03:00`);
  const end = new Date(`${ymd}T23:59:59.999-03:00`);
  return { start, end, ymd };
}

export const OPEN_ORDER_STATUSES = ["DRAFT", "APPROVED", "IN_PROGRESS"] as const;
export const WORK_ORDER_STATUSES = ["APPROVED", "IN_PROGRESS"] as const;
