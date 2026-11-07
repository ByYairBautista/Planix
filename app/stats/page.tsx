"use client";

import { useMemo, useState, useEffect } from "react";
import { useApp } from "@/lib/providers";
import { isPastDue, todayStr } from "@/lib/date-utils";
import { Card, StatBadge } from "@/components/ui";

export default function StatsPage() {
  const { db, user } = useApp();
  const tasks = db.tasks.filter((t) => t.userId === user.id);
  const [today, setToday] = useState("");

  useEffect(() => { setToday(todayStr()); }, []);

  const completed = tasks.filter((t) => t.completed);
  const pending = tasks.filter((t) => !t.completed);
  const overdue = pending.filter((t) => isPastDue(t.dueDate, t.dueTime, today));
  const total = tasks.length;
  const productivity = total ? Math.round((completed.length / total) * 100) : 0;

  const catCounts: Record<string, number> = {};
  tasks.forEach((t) => { const key = t.categoryId || "sin"; catCounts[key] = (catCounts[key] || 0) + 1; });
  const categories = db.categories.filter((c) => c.userId === user.id);
  const catActivity = categories.map((c) => ({ name: c.name, color: c.color, count: catCounts[c.id] || 0 })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

  const [last7, setLast7] = useState<string[]>([]);
  useEffect(() => {
    const arr: string[] = [];
    const pad = (n: number) => String(n).padStart(2, "0");
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      arr.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
    setLast7(arr);
  }, []);

  const streakDays = last7.filter((ds) =>
    completed.some((t) => t.completedAt && t.completedAt.slice(0, 10) === ds)
  ).length;

  const maxBar = Math.max(...catActivity.map((c) => c.count), 1);

  return (
    <div className="page section max-w-3xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Estadísticas</h1>
        <p className="text-[var(--color-text-secondary)]">Tu productividad a simple vista.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatBadge label="Tareas completadas" value={completed.length} icon="M5 13l4 4L19 7" color="text-[var(--color-success)]" />
        <StatBadge label="Tareas pendientes" value={pending.length} icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" color="text-[var(--color-accent)]" />
        <StatBadge label="Porcentaje" value={productivity + "%"} icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" color="text-[var(--color-text)]" />
        <StatBadge label="Atrasadas" value={overdue.length} icon="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" color="text-[var(--color-alert)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Rendimiento general</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90"><circle cx="64" cy="64" r="54" stroke="var(--color-divider)" strokeWidth="10" fill="none" /><circle cx="64" cy="64" r="54" stroke="var(--color-accent)" strokeWidth="10" fill="none" strokeDasharray="340" strokeDashoffset={340 - (340 * productivity) / 100} style={{ transition: "stroke-dashoffset 0.8s ease" }} /></svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold text-[var(--color-text)]">{productivity}</span><span className="text-xs text-[var(--color-text-secondary)]">%</span></div>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">de tus tareas están completadas</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{completed.length} de {total} tareas</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Racha actual</h3>
          <div className="flex items-center justify-between mb-4"><span className="text-3xl font-bold text-[var(--color-text)]">{streakDays}</span><span className="text-xs text-[var(--color-text-secondary)]">días</span></div>
          <div className="flex gap-1">{last7.map((ds) => { const done = completed.some((t) => t.completedAt && t.completedAt.slice(0, 10) === ds); return (<div key={ds} className="h-2 w-4 rounded-sm" style={{ backgroundColor: done ? "var(--color-accent)" : "var(--color-divider)" }} />); })}</div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-3">Últimos 7 días</p>
        </Card>
      </div>

      <Card className="mt-8 p-6">
        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Actividad por categoría</h3>
        <div className="space-y-3">
          {catActivity.length === 0 ? (<p className="text-xs text-[var(--color-text-secondary)]">Sin actividad registrada.</p>) : (
            catActivity.map((c) => {
              const barWidth = ((c.count / maxBar) * 100) + '%';
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm text-[var(--color-text)] truncate">{c.name}</span>
                  <div className="flex-1 h-2 bg-[var(--color-divider)] rounded overflow-hidden ml-4">
                    <div className="h-full bg-[var(--color-accent)]" style={{ width: barWidth }}></div>
                  </div>
                  <span className="w-10 text-right text-xs font-medium text-[var(--color-text-secondary)]">{c.count}</span>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
