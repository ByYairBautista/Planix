"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useApp } from "@/lib/providers";
import { generateId } from "@/lib/storage";
import { nowIso, todayStr, getMonthDates, getWeekDates, formatDate, datePart, formatTaskTime } from "@/lib/date-utils";
import { Card, Button, Input, Badge, Label, Select } from "@/components/ui";
import { Dialog } from "@/components/ui";
import EmptyState from "@/components/EmptyState";
import FAB from "@/components/FAB";
import type { Task, Reminder, Alarm, Priority } from "@/lib/types";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WEEKDAYS_MON = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKDAYS_SUN = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function localDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isPriority(value: string): value is Priority {
  return value === "baja" || value === "media" || value === "alta" || value === "urgente";
}

export default function CalendarPage() {
  const { db, user, saveDb, preferences } = useApp();
  const [open, setOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
  const [todayIso, setTodayIso] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [view, setView] = useState<"mes" | "semana" | "dia">("mes");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Initialize the date-dependent calendar only after hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { const d = new Date(); setCalendarDate(d); setTodayIso(todayStr()); setSelectedDate(todayStr()); }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const tasks = db.tasks.filter((t) => t.userId === user.id);
  const reminders = db.reminders.filter((r) => r.userId === user.id);
  const alarms = db.alarms.filter((a) => a.userId === user.id);

  const year = calendarDate ? calendarDate.getFullYear() : 0;
  const month = calendarDate ? calendarDate.getMonth() : 0;

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type }); setTimeout(() => setToast(null), 4000);
  }, []);

  const weekdays = preferences.firstDayOfWeek === 1 ? WEEKDAYS_MON : WEEKDAYS_SUN;
  const monthDays = useMemo(() => calendarDate ? getMonthDates(year, month, preferences.firstDayOfWeek) : [], [calendarDate, year, month, preferences.firstDayOfWeek]);
  const weekDays = useMemo(() => calendarDate ? getWeekDates(calendarDate, preferences.firstDayOfWeek) : [], [calendarDate, preferences.firstDayOfWeek]);

  const activitiesFor = useCallback((d: Date) => {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const t = tasks.filter((x) => datePart(x.dueDate) === ds);
    const r = reminders.filter((x) => datePart(x.datetime) === ds);
    const a = alarms.filter((x) => x.days.includes(d.getDay()));
    return { tasks: t, reminders: r, alarms: a };
  }, [tasks, reminders, alarms]);

  const prevMonth = () => { if (!calendarDate) return; setCalendarDate(new Date(year, month - 1, 1)); };
  const nextMonth = () => { if (!calendarDate) return; setCalendarDate(new Date(year, month + 1, 1)); };
  const shiftDays = (n: number) => { if (!calendarDate) return; const d = new Date(calendarDate); d.setDate(d.getDate() + n); setCalendarDate(d); setSelectedDate(localDay(d)); };

  const handleSaveActivity = useCallback((data: { title: string; description: string; date: string; time: string; type: "task" | "reminder"; priority: Priority; }) => {
    if (data.type === "task") {
      const task: Task = { id: generateId("task"), userId: user.id, categoryId: null, title: data.title, description: data.description, dueDate: data.date, dueTime: data.time || null, priority: data.priority, completed: false, completedAt: null, favorite: false, tags: [], notes: "", subtasks: [], repeat: "none", repeatConfig: null, createdAt: nowIso(), updatedAt: nowIso() };
      saveDb((d) => ({ ...d, tasks: [task, ...d.tasks] }));
      showToast("Tarea creada desde el calendario", "success");
    } else {
      const rem: Reminder = { id: generateId("rem"), userId: user.id, taskId: null, title: data.title, description: data.description, datetime: `${data.date}T${data.time || "09:00"}:00`, anticipation: 10, repeat: "none", attended: false, attendedAt: null, createdAt: nowIso() };
      saveDb((d) => ({ ...d, reminders: [rem, ...d.reminders] }));
      showToast("Recordatorio creado desde el calendario", "success");
    }
    setOpen(false);
  }, [user.id, saveDb, showToast]);

  if (!calendarDate) {
    return (<div className="page section max-w-4xl mx-auto px-4"><div className="flex items-center justify-center py-20 text-[var(--color-text-muted)]">Cargando…</div></div>);
  }

  return (
    <div className="page section max-w-4xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Calendario</h1>
          <p className="text-[var(--color-text-secondary)]">Tus tareas, recordatorios y alarmas por día.</p>
        </div>
        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => setOpen(true)}>+ Nueva actividad</Button></div>
      </div>

      {toast && (<div className="mb-4 px-4 py-3 rounded-[var(--radius)] bg-[#43A581]/10 border border-[#43A581]/20 text-[#2E7D58] text-sm fade-in">{toast.message}</div>)}

      <div className="flex mb-8">{(["mes", "semana", "dia"] as const).map((v) => {
        const active = view === v;
        return (<button key={v} onClick={() => setView(v)} className={[
          "px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all",
          active ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white" : "border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]",
        ].filter(Boolean).join(" ")} aria-pressed={active}>{v === "mes" ? "Mes" : v === "semana" ? "Semana" : "Día"}</button>);
      })}</div>

      {view === "mes" ? (<div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={prevMonth} aria-label="Mes anterior"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" /></svg></Button>
              <span className="text-lg font-bold text-[var(--color-text)]">{MONTHS[month]} {year}</span>
              <Button variant="ghost" size="sm" onClick={nextMonth} aria-label="Mes siguiente"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg></Button>
              <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); setCalendarDate(d); setSelectedDate(todayStr()); }}>Hoy</Button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2">{weekdays.map((d) => (<div key={d} className="text-center">{d}</div>))}</div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((d) => {
              const isCurrentMonth = d.getMonth() === month;
              const ds = localDay(d);
              const isToday = ds === todayIso;
              const isSelected = ds === selectedDate;
              const { tasks: t, reminders: r, alarms: a } = activitiesFor(d);
              const count = t.length + r.length + a.length;
              return (<div key={ds} className={[
                "aspect-square flex flex-col items-center justify-center rounded-[var(--radius-sm)] border transition-all cursor-pointer group",
                !isCurrentMonth ? "text-[var(--color-text-muted)] border-transparent" : "",
                isToday ? "ring-2 ring-[var(--color-accent)] bg-[var(--color-accent)]/10" : "",
                isSelected ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)]" : "",
                count > 0 && !isSelected ? "bg-[var(--color-accent)]/5" : "",
              ].filter(Boolean).join(" ")} onClick={() => setSelectedDate(ds)} role="button" aria-pressed={isSelected}>
                <div className={["text-xs font-medium", !isCurrentMonth ? "text-[var(--color-text-muted)]" : "", isToday ? "text-[var(--color-accent)] font-bold" : "text-[var(--color-text)]"].filter(Boolean).join(" ")}>{d.getDate()}</div>
                {count > 0 && (<div className="mt-1 flex gap-1">{[...t.slice(0, 2), ...r.slice(0, 2)].slice(0, 3).map((_, i) => (<div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2e3a59" }} />))}{count > 3 && (<span className="text-[9px] text-[var(--color-text-muted)]">+{count - 3}</span>)}</div>)}
              </div>);
            })}
          </div>
        </div>
        <DayPanel selectedDate={selectedDate} tasks={tasks} reminders={reminders} alarms={alarms} onNew={() => setOpen(true)} />
      </div>) : view === "semana" ? (<div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => shiftDays(-7)} aria-label="Semana anterior"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" /></svg></Button>
            <span className="text-lg font-bold text-[var(--color-text)]">Semana del {weekDays[0] ? formatDate(weekDays[0].toISOString(), { day: "numeric", month: "short" }) : ""}</span>
            <Button variant="ghost" size="sm" onClick={() => shiftDays(7)} aria-label="Semana siguiente"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg></Button>
            <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); setCalendarDate(d); setSelectedDate(todayStr()); }}>Hoy</Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d, i) => {
              const ds = localDay(d);
              const { tasks: t, reminders: r, alarms: a } = activitiesFor(d);
              const isToday = ds === todayIso;
              const isSelected = ds === selectedDate;
              return (
                <button key={ds} onClick={() => setSelectedDate(ds)} className={[
                  "min-h-[150px] rounded-[var(--radius-sm)] border p-2 text-left transition-all flex flex-col gap-1.5",
                  isSelected ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]",
                ].filter(Boolean).join(" ")} aria-pressed={isSelected}>
                  <span className={["text-[11px] font-bold uppercase", isToday ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"].filter(Boolean).join(" ")}>{weekdays[i]}</span>
                  <span className={["text-base font-bold", isToday ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"].filter(Boolean).join(" ")}>{d.getDate()}</span>
                  <span className="space-y-1">
                    {[...t.map((x) => ({ label: x.title, time: x.dueTime })), ...r.map((x) => ({ label: x.title, time: x.datetime.slice(11, 16) }))].slice(0, 3).map((x, j) => (
                      <span key={j} className="block text-[10px] leading-tight truncate bg-[var(--color-accent)]/10 text-[var(--color-text)] rounded px-1 py-0.5">{x.time ? `${x.time} ` : ""}{x.label}</span>
                    ))}
                    {a.slice(0, 1).map((x) => (<span key={x.id} className="block text-[10px] leading-tight truncate bg-[var(--color-warning-light)] rounded px-1 py-0.5">⏰ {x.time} {x.name}</span>))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <DayPanel selectedDate={selectedDate} tasks={tasks} reminders={reminders} alarms={alarms} onNew={() => setOpen(true)} />
      </div>) : (<div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => shiftDays(-1)} aria-label="Día anterior"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" /></svg></Button>
            <span className="text-lg font-bold text-[var(--color-text)] capitalize">{formatDate(selectedDate + "T12:00:00", { weekday: "long", day: "numeric", month: "long" })}</span>
            <Button variant="ghost" size="sm" onClick={() => shiftDays(1)} aria-label="Día siguiente"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg></Button>
            <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); setCalendarDate(d); setSelectedDate(todayStr()); }}>Hoy</Button>
          </div>
          <DayPanel selectedDate={selectedDate} tasks={tasks} reminders={reminders} alarms={alarms} onNew={() => setOpen(true)} wide />
        </div>
      </div>)}

      <ActivityFormModal open={open} onClose={() => setOpen(false)} onSave={handleSaveActivity} initialDate={selectedDate} />
      <FAB onClick={() => setOpen(true)} />
    </div>
  );
}

function DayPanel({ selectedDate, tasks, reminders, alarms, onNew, wide = false }: { selectedDate: string; tasks: Task[]; reminders: Reminder[]; alarms: Alarm[]; onNew: () => void; wide?: boolean }) {
  const [y, m, d] = selectedDate.split("-").map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  const dayTasks = tasks.filter((t) => datePart(t.dueDate) === selectedDate).sort((a, b) => (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59"));
  const dayReminders = reminders.filter((r) => datePart(r.datetime) === selectedDate).sort((a, b) => a.datetime.localeCompare(b.datetime));
  const dayAlarms = alarms.filter((a) => a.days.includes(dateObj.getDay()));
  const total = dayTasks.length + dayReminders.length + dayAlarms.length;

  return (
    <div className={wide ? "w-full" : "w-full md:w-96 shrink-0"}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">Actividades</p>
            <p className="text-base font-bold text-[var(--color-text)] capitalize">{formatDate(selectedDate + "T12:00:00", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onNew}>+ Nueva</Button>
        </div>
        {total === 0 ? (
          <EmptyState title="Sin actividades este día" subtitle="No hay tareas, recordatorios ni alarmas para esta fecha." icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2" action={onNew} actionLabel="Crear actividad" />
        ) : (
          <div className="space-y-4">
            {dayTasks.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Tareas ({dayTasks.length})</p>
                <ul className="space-y-2">
                  {dayTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-glass-border)]">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${t.completed ? "bg-[var(--color-success)]" : "bg-[var(--color-accent)]"}`} />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold truncate ${t.completed ? "line-through text-[var(--color-text-muted)]" : ""}`}>{t.title}</span>
                        {t.dueTime && <span className="block text-[11px] font-mono text-[var(--color-text-secondary)]">{formatTaskTime(t.dueDate, t.dueTime, 24)}</span>}
                      </span>
                      <Badge variant={t.priority} className="text-[10px] shrink-0">{t.priority}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dayReminders.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Recordatorios ({dayReminders.length})</p>
                <ul className="space-y-2">
                  {dayReminders.map((r) => (
                    <li key={r.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-glass-border)]">
                      <span className="text-sm">🔔</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold truncate">{r.title}</span>
                        <span className="block text-[11px] font-mono text-[var(--color-text-secondary)]">{r.datetime.slice(11, 16)}</span>
                      </span>
                      {r.attended && <Badge variant="success" className="text-[10px] shrink-0">Atendido</Badge>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dayAlarms.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Alarmas ({dayAlarms.length})</p>
                <ul className="space-y-2">
                  {dayAlarms.map((a) => (
                    <li key={a.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-glass-border)]">
                      <span className="text-sm">⏰</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold truncate">{a.name}</span>
                        <span className="block text-[11px] font-mono text-[var(--color-text-secondary)]">{a.time}</span>
                      </span>
                      <Badge variant={a.active ? "success" : "neutral"} className="text-[10px] shrink-0">{a.active ? "Activa" : "Inactiva"}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function ActivityFormModal({ open, onClose, onSave, initialDate }: { open: boolean; onClose: () => void; onSave: (data: { title: string; description: string; date: string; time: string; type: "task" | "reminder"; priority: Priority; }) => void; initialDate: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState<"task" | "reminder">("task");
  const [priority, setPriority] = useState<Priority>("media");

  // Reset the form each time the create dialog is opened.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setTitle(""); setDescription(""); setDate(initialDate || todayStr()); setTime("09:00"); setType("task"); setPriority("media");
    }
  }, [open, initialDate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!title) return; onSave({ title, description, date, time, type, priority }); };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Nueva actividad</h2>
        <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus /></div>
        <div><Label>Descripción</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Fecha</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
          <div><Label>Hora</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></div>
        </div>
        <div><Label>Tipo</Label><div className="flex gap-2"><button type="button" onClick={() => setType("task")} className={[
          "flex-1 py-2.5 rounded-[var(--radius-sm)] border text-sm font-medium transition-all",
          type === "task" ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]",
        ].filter(Boolean).join(" ")}>Tarea</button><button type="button" onClick={() => setType("reminder")} className={[
          "flex-1 py-2.5 rounded-[var(--radius-sm)] border text-sm font-medium transition-all",
          type === "reminder" ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]",
        ].filter(Boolean).join(" ")}>Recordatorio</button></div></div>
        {type === "task" && (<div><Label>Prioridad</Label><Select value={priority} onChange={(value) => {
          if (isPriority(value)) setPriority(value);
        }} options={[{ label: "Baja", value: "baja" }, { label: "Media", value: "media" }, { label: "Alta", value: "alta" }, { label: "Urgente", value: "urgente" }]} /></div>)}
        <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">Crear {type === "task" ? "tarea" : "recordatorio"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
