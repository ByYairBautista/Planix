export const LOCALE = "es";

export function nowIso() {
  return new Date().toISOString();
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Extrae YYYY-MM-DD de un ISO completo o ya normalizado. */
export function datePart(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const m = String(iso).match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

export function parseDateOnly(iso: string | null) {
  return datePart(iso);
}

export function isSameDay(a: string, b: string) {
  return datePart(a) === datePart(b);
}

export function isPastDue(dueDate: string | null, dueTime: string | null, today: string) {
  const dp = datePart(dueDate);
  if (!dp) return false;
  if (dp < today) return true;
  if (dp === today && dueTime) {
    const [h, m] = dueTime.split(":").map(Number);
    const due = new Date();
    due.setHours(h, m, 0, 0);
    return Date.now() > due.getTime();
  }
  return false;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...opts,
  });
}

export function formatTime(isoOrTime: string, timeFormat: 12 | 24 = 24) {
  if (!isoOrTime) return "—";
  // Entrada HH:mm o HH:mm:ss
  const hm = String(isoOrTime).match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hm) {
    const h = Number(hm[1]);
    const min = hm[2];
    if (timeFormat === 12) {
      const suffix = h >= 12 ? "p. m." : "a. m.";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${min} ${suffix}`;
    }
    return `${String(h).padStart(2, "0")}:${min}`;
  }
  const d = new Date(isoOrTime);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat === 12,
  });
}

/** Hora de una tarea a partir de dueDate (ISO) + dueTime (HH:mm). Nunca retorna Invalid Date. */
export function formatTaskTime(dueDate: string | null, dueTime: string | null, timeFormat: 12 | 24 = 24): string {
  if (dueTime) return formatTime(dueTime, timeFormat);
  if (dueDate) {
    // Si dueDate trae hora en el ISO, úsala; si es solo fecha, no hay hora
    if (/T\d/.test(dueDate)) return formatTime(dueDate, timeFormat);
    return "";
  }
  return "";
}

export function formatRelative(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const now = Date.now();
  const diff = d.getTime() - now;
  const abs = Math.abs(diff);
  const min = Math.floor(abs / 60000);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  const r = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  if (min < 60) return r.format(diff < 0 ? -min : min, "minute");
  if (hour < 48) return r.format(diff < 0 ? -hour : hour, "hour");
  if (day < 30) return r.format(diff < 0 ? -day : day, "day");
  return formatDate(dateStr);
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function getWeekDates(date: Date, firstDayOfWeek: 0 | 1) {
  const d = startOfDay(date);
  const day = d.getDay();
  const offset = firstDayOfWeek === 1 ? (day === 0 ? -6 : 1 - day) : -day;
  const start = addDays(d, offset);
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }
  return days;
}

export function getMonthDates(year: number, month: number, firstDayOfWeek: 0 | 1 = 1) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Offset hasta el primer día de la semana (0=Dom, 1=Lun)
  const offset = firstDayOfWeek === 1 ? (first.getDay() + 6) % 7 : first.getDay();
  const start = addDays(first, -offset);
  const days = [];
  for (let d = addDays(start, 0); d <= last; d = addDays(d, 1)) {
    days.push(d);
  }
  return days;
}

export function getMonthDays(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function parseHHmm(t: string) {
  const [h, m] = t.split(":").map(Number);
  return { h, m };
}

export function nextReminderOccurrence(
  datetime: string,
  repeat: "diaria" | "semanal" | "mensual",
  monthlyDay?: number,
): string {
  const next = new Date(datetime);
  const dayOfMonth = monthlyDay ?? next.getDate();
  if (repeat === "diaria") next.setDate(next.getDate() + 1);
  else if (repeat === "semanal") next.setDate(next.getDate() + 7);
  else {
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(dayOfMonth, lastDay));
  }
  return next.toISOString();
}
