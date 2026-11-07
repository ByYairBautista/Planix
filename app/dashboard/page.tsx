"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/providers";
import { toggleTaskCompletion } from "@/lib/storage";
import { isPastDue, formatRelative, formatTaskTime, datePart, todayStr, LOCALE } from "@/lib/date-utils";
import { Card, Button, Badge, StatBadge } from "@/components/ui";
import FAB from "@/components/FAB";
import EmptyState from "@/components/EmptyState";

const PRIORITY_DOT: Record<string, string> = {
  urgente: "bg-[var(--color-alert)]",
  alta: "bg-[#ef4444]",
  media: "bg-[var(--color-warning)]",
  baja: "bg-[var(--color-text-muted)]",
};

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default function Dashboard() {
  const { db, user, preferences, theme, setTheme, saveDb } = useApp();
  const router = useRouter();
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [today, setToday] = useState("");
  const [greetingText, setGreetingText] = useState("");
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const h = d.getHours();
      setGreetingText(h < 6 ? "Buenas noches" : h < 13 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches");
      setDateStr(capitalize(d.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" })));
      setTimeStr(d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", hour12: preferences.timeFormat === 12 }));
      setToday(todayStr());
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [preferences.timeFormat]);

  const tasks = useMemo(() => db.tasks.filter((t) => t.userId === user.id), [db, user.id]);
  const reminders = useMemo(() => db.reminders.filter((r) => r.userId === user.id), [db, user.id]);
  const alarms = useMemo(() => db.alarms.filter((a) => a.userId === user.id), [db, user.id]);

  const pending = tasks.filter((t) => !t.completed && !isPastDue(t.dueDate, t.dueTime, today));
  const overdue = tasks.filter((t) => !t.completed && isPastDue(t.dueDate, t.dueTime, today));
  const completed = tasks.filter((t) => t.completed);

  const sortedToday = useMemo(() => {
    return tasks
      .filter((t) => datePart(t.dueDate) === today)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const ta = a.dueTime || "23:59";
        const tb = b.dueTime || "23:59";
        return ta.localeCompare(tb);
      });
  }, [tasks, today]);

  const totalToday = sortedToday.length;
  const doneToday = sortedToday.filter((t) => t.completed).length;
  const progress = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

  const upcomingReminders = reminders.filter((r) => !r.attended).sort((a, b) => a.datetime.localeCompare(b.datetime)).slice(0, 4);
  const upcomingAlarms = alarms.filter((a) => a.active).slice(0, 4);

  const showToast = useCallback((msg: string) => {
    setToast({ message: msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const toggleTask = useCallback((id: string) => {
    const t = db.tasks.find((x) => x.id === id);
    const next = !t?.completed;
    saveDb((d) => toggleTaskCompletion(d, id));
    showToast(next ? "Tarea completada ✓" : "Tarea reabierta");
  }, [db, saveDb, showToast]);

  const deleteTask = useCallback((id: string) => {
    if (!window.confirm("¿Eliminar esta tarea? Esta acción no se puede deshacer.")) return;
    saveDb((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) }));
    showToast("Tarea eliminada");
  }, [saveDb, showToast]);

  const handleNewTask = () => router.push("/tasks/nueva");
  const handleEditTask = (id: string) =>
    router.push(`/tasks/editar?id=${encodeURIComponent(id)}`);

  return (
    <div className="w-full max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-6 fade-in">
      {/* ——— Hero ——— */}
      <section className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 lg:p-10 mb-5 sm:mb-6 shadow-[var(--color-shadow-lg)]"
        style={{ background: "linear-gradient(135deg, #2e3a59 0%, #24304a 52%, #7fa0be 100%)" }}>
        <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(185,255,245,.40) 0%, transparent 68%)" }} />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(182,199,214,.35) 0%, transparent 68%)" }} />
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(70% 90% at 30% 20%, black, transparent)" }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-white/90 bg-white/15 border border-white/25 backdrop-blur rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              {greetingText}
            </span>
            <h1 className="text-[30px] sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-[1.05] mt-3">
              {greetingText === "Buenas noches" ? "Que descanses" : "Hola"}, {user.name.split(" ")[0]}
            </h1>
            <p className="text-white/75 text-sm sm:text-[15px] mt-2">{dateStr} · Tienes {pending.length} pendiente{pending.length === 1 ? "" : "s"} y {overdue.length} atrasada{overdue.length === 1 ? "" : "s"}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              <button onClick={handleNewTask} className="inline-flex items-center gap-2 bg-white text-[#2e3a59] font-bold text-sm rounded-xl px-4 py-2.5 shadow-lg hover:scale-[1.03] active:scale-95 transition-transform">
                <span className="text-lg leading-none">+</span> Nueva tarea
              </button>
              <button onClick={() => router.push("/calendar")} className="inline-flex items-center gap-2 bg-white/15 border border-white/25 backdrop-blur text-white font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-white/25 transition-colors">
                Ver calendario
              </button>
            </div>
          </div>

          <div className="flex lg:flex-col items-center lg:items-end gap-3 shrink-0">
            <div className="bg-white/15 border border-white/25 backdrop-blur-xl rounded-3xl px-5 sm:px-6 py-4 text-center min-w-[150px] shadow-inner">
              <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-tight leading-none tabular-nums">{timeStr}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-[0.22em] mt-1.5 font-semibold">{preferences.timeFormat === 24 ? "24 horas" : "12 horas"}</div>
            </div>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 backdrop-blur text-white flex items-center justify-center hover:bg-white/25 transition-all text-lg"
              aria-label="Cambiar tema"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </section>

      {toast && <div className="mb-4 px-4 py-3 rounded-2xl glass-modal text-sm font-medium fade-in">{toast.message}</div>}

      {/* ——— Stats ——— */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6 stagger">
        <StatBadge label="Pendientes" value={pending.length} icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" color="accent" />
        <StatBadge label="Completadas" value={completed.length} icon="M5 13l4 4L19 7" color="success" />
        <StatBadge label="Atrasadas" value={overdue.length} icon="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" color="alert" />
        <StatBadge label="Hoy" value={totalToday} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2" color="warning" />
      </div>

      {/* ——— Bento: Mi día + lateral ——— */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        <section className="lg:col-span-2 card p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
            <div>
              <h2 className="section-title">Mi día</h2>
              <p className="section-subtitle mt-0.5">Tus actividades de hoy, en orden</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleNewTask} className="shrink-0">+ Agregar</Button>
          </div>

          {sortedToday.length === 0 ? (
            <EmptyState title="Sin actividades hoy" subtitle="Tu día está libre. Agrega una tarea para empezar con energía." icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" action={handleNewTask} actionLabel="Crear primera tarea" />
          ) : (
            <div className="relative space-y-0">
              <div className="absolute left-[35px] sm:left-[39px] top-3 bottom-3 w-px bg-[var(--color-divider)]" aria-hidden />
              {sortedToday.map((t) => {
                const cat = db.categories.find((c) => c.id === t.categoryId);
                const overdueT = !t.completed && isPastDue(t.dueDate, t.dueTime, today);
                const timeLabel = formatTaskTime(t.dueDate, t.dueTime, preferences.timeFormat);
                return (
                  <div key={t.id} className="relative flex gap-3 sm:gap-4 py-2.5 group">
                    <div className="w-[52px] sm:w-[56px] shrink-0 text-right pt-2.5">
                      <span className="text-[12px] font-mono font-bold text-[var(--color-text-secondary)] tabular-nums">{timeLabel || "Todo el día"}</span>
                    </div>
                    <div className={`relative z-10 mt-2.5 w-3 h-3 rounded-full ring-4 ring-[var(--color-surface-solid)] shrink-0 ${PRIORITY_DOT[t.priority] || "bg-[var(--color-accent)]"}`} />
                    <div className={`flex-1 min-w-0 rounded-2xl border p-3.5 sm:p-4 transition-all flex items-center gap-3 ${t.completed ? "bg-transparent border-[var(--color-divider)] opacity-70" : "bg-[var(--color-surface-hover)] border-[var(--color-glass-border)] hover:border-[var(--color-accent)]/40 hover:shadow-[var(--color-shadow-md)]"}`}>
                      <button
                        onClick={() => toggleTask(t.id)}
                        className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${t.completed ? "bg-[var(--color-success)] border-[var(--color-success)] text-white" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-success)]"}`}
                        aria-label={t.completed ? "Marcar como pendiente" : "Marcar como completada"}
                      >
                        {t.completed && <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </button>
                      <button onClick={() => handleEditTask(t.id)} className="flex-1 min-w-0 text-left">
                        <span className={`block text-sm font-semibold truncate ${t.completed ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}`}>{t.title}</span>
                        {t.description && <span className="block text-[12px] text-[var(--color-text-secondary)] truncate mt-0.5">{t.description}</span>}
                        <span className="flex flex-wrap items-center gap-1.5 mt-2">
                          <Badge variant={t.priority}>{capitalize(t.priority)}</Badge>
                          {overdueT && <Badge variant="alert">Atrasada</Badge>}
                          {cat && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)]"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />{cat.name}</span>}
                        </span>
                      </button>
                      <button onClick={() => deleteTask(t.id)} className="w-8 h-8 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-alert)] hover:bg-[var(--color-alert-light)] transition-all flex items-center justify-center shrink-0 sm:opacity-0 sm:group-hover:opacity-100" title="Eliminar" aria-label="Eliminar">
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Lateral */}
        <aside className="space-y-4 sm:space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em]">Progreso de hoy</p>
                <p className="text-lg font-extrabold tracking-tight mt-0.5">{doneToday} de {totalToday} tareas</p>
              </div>
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" stroke="var(--color-divider)" strokeWidth="6" fill="none" />
                  <circle cx="28" cy="28" r="24" stroke="var(--color-accent)" strokeWidth="6" fill="none" strokeDasharray="151" strokeDashoffset={151 - (151 * progress) / 100} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s ease" }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold">{progress}%</span>
              </div>
            </div>
            <div className="w-full bg-[var(--color-divider)] rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))" }} />
            </div>
            {totalToday === 0 && <p className="mt-3 text-xs text-[var(--color-text-secondary)]">Sin tareas para hoy. ¡Aprovecha el día!</p>}
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-4">Próximos recordatorios</h3>
            {upcomingReminders.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-secondary)]">Sin recordatorios programados.</p>
            ) : (
              <ul className="space-y-2.5">
                {upcomingReminders.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-glass-border)]">
                    <span className="w-9 h-9 rounded-xl bg-[var(--color-warning-light)] text-[var(--color-warning)] flex items-center justify-center shrink-0">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{r.title}</span>
                      <span className="block text-[11px] text-[var(--color-text-secondary)]">{formatRelative(r.datetime)}</span>
                    </span>
                    <Badge variant="accent" className="shrink-0">Pronto</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-4">Próximas alarmas</h3>
            {upcomingAlarms.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-secondary)]">Sin alarmas activas.</p>
            ) : (
              <ul className="space-y-2.5">
                {upcomingAlarms.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-glass-border)]">
                    <span className="w-9 h-9 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{a.name}</span>
                      <span className="block text-[11px] font-mono text-[var(--color-text-secondary)] tabular-nums">{a.time}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-success)] shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />Activa
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)] pt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
        Planix — Tus datos se guardan automáticamente en este dispositivo.
      </div>

      <FAB onClick={handleNewTask} />
    </div>
  );
}
