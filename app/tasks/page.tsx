"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/providers";
import { generateId } from "@/lib/storage";
import { nowIso, todayStr, isPastDue, formatTaskTime, datePart } from "@/lib/date-utils";
import { Card, Button, Input, Badge, Label, Select, Checkbox } from "@/components/ui";
import { Dialog } from "@/components/ui";
import { TaskFormModal } from "@/components/TaskFormModal";
import EmptyState from "@/components/EmptyState";
import FAB from "@/components/FAB";

type View = "todas" | "hoy" | "proximamente" | "completadas" | "atrasadas" | "favoritas";

const VIEWS: { key: View; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "hoy", label: "Hoy" },
  { key: "proximamente", label: "Próximamente" },
  { key: "completadas", label: "Completadas" },
  { key: "atrasadas", label: "Atrasadas" },
  { key: "favoritas", label: "Favoritas" },
];

export default function TasksPage() {
  const { db, user, saveDb } = useApp();
  const router = useRouter();
  const [view, setView] = useState<View>("todas");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [today, setToday] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const openEdit = useCallback((id: string) => { setEditId(id); setOpen(true); }, []);
  const closeModal = useCallback(() => { setOpen(false); setEditId(null); }, []);

  useEffect(() => { setToday(todayStr()); }, []);

  const tasks = useMemo(() => db.tasks.filter((t) => t.userId === user.id), [db, user.id]);
  const categories = db.categories.filter((c) => c.userId === user.id);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !(t.title || "").toLowerCase().includes(search.toLowerCase()) && !(t.description || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && t.categoryId !== categoryFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      switch (view) {
        case "hoy": return datePart(t.dueDate) === today && !t.completed;
        case "completadas": return t.completed;
        case "atrasadas": return !t.completed && isPastDue(t.dueDate, t.dueTime, today);
        case "proximamente": return !t.completed && datePart(t.dueDate) && datePart(t.dueDate)! > today;
        case "favoritas": return t.favorite;
        default: return true;
      }
    });
  }, [tasks, search, categoryFilter, priorityFilter, view, today]);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type }); setTimeout(() => setToast(null), 4000);
  }, []);

  const toggleTask = useCallback((id: string) => {
    const t = db.tasks.find((x) => x.id === id);
    const completed = !t?.completed;
    saveDb((d) => ({ ...d, tasks: d.tasks.map((x) => x.id === id ? { ...x, completed, completedAt: completed ? nowIso() : null, updatedAt: nowIso() } : x) }));
    showToast(completed ? "Tarea completada" : "Tarea reabierta", "success");
  }, [db, saveDb, showToast]);

  const deleteTask = useCallback((id: string) => {
    if (!window.confirm("¿Eliminar esta tarea? Esta acción no se puede deshacer.")) return;
    saveDb((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) }));
    showToast("Tarea eliminada", "success");
  }, [saveDb, showToast]);

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgente": return "bg-[var(--color-alert-light)] text-[var(--color-alert)] border-[var(--color-alert)]";
      case "alta": return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]";
      case "media": return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]";
      default: return "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border-[var(--color-text-muted)]";
    }
  };

  return (
    <div className="page section max-w-4xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Tareas</h1>
          <p className="text-[var(--color-text-secondary)]">Gestiona tus pendientes y organiza tu tiempo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>+ Nueva tarea</Button>
        </div>
      </div>

      {toast && (<div className="mb-4 px-4 py-3 rounded-[var(--radius)] bg-[#43A581]/10 border border-[#43A581]/20 text-[#2E7D58] text-sm fade-in">{toast.message}</div>)}

      {/* Views tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {VIEWS.map((v) => {
          const active = view === v.key;
          return (
            <button key={v.key} onClick={() => setView(v.key)} className={[
              "px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-all whitespace-nowrap shrink-0",
              active ? "bg-[var(--color-accent)] text-white shadow-sm" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] border border-transparent",
            ].filter(Boolean).join(" ")} aria-pressed={active}>{v.label}</button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 items-end">
        <div className="flex-1 min-w-[200px]"><Label>Buscar tareas</Label><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o descripción" /></div>
        <div className="flex-1 min-w-[160px]"><Label>Categoría</Label><Select value={categoryFilter} onChange={setCategoryFilter} options={[{ label: "Todas", value: "" }, ...categories.map((c) => ({ label: c.name, value: c.id }))]} /></div>
        <div className="flex-1 min-w-[160px]"><Label>Prioridad</Label><Select value={priorityFilter} onChange={setPriorityFilter} options={[{ label: "Todas", value: "" }, { label: "Baja", value: "baja" }, { label: "Media", value: "media" }, { label: "Alta", value: "alta" }, { label: "Urgente", value: "urgente" }]} /></div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState title="Sin tareas" subtitle={view === "completadas" ? "Aún no has completado tareas." : "No hay tareas que coincidan con tus filtros."} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" action={() => setOpen(true)} actionLabel="Crear tarea" />
        ) : (
          filtered.map((t) => {
            const cat = db.categories.find((c) => c.id === t.categoryId);
            const overdue = !t.completed && isPastDue(t.dueDate, t.dueTime, today);
            const dueToday = datePart(t.dueDate) === today;
            return (
              <Card key={t.id} className="p-4 group cursor-pointer hover:border-[var(--color-accent)]/50 transition-all" onClick={() => openEdit(t.id)}>
                <div className="flex items-start gap-3">
                  <button onClick={(e) => { e.stopPropagation(); toggleTask(t.id); }} className="w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 mt-0.5" style={{ borderColor: t.completed ? "var(--color-success)" : "var(--color-border)" }} aria-label={t.completed ? "Marcar como pendiente" : "Marcar como completada"}>{t.completed && (<svg width="16" height="16" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}</button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={["text-sm font-medium truncate", t.completed ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-text)]"].filter(Boolean).join(" ")}>{t.title}</p>
                      {t.favorite && <Badge variant="neutral" className="text-[10px] px-2 py-0.5">★</Badge>}
                      {overdue && <Badge variant="alert" className="text-[10px] px-2 py-0.5">Atrasada</Badge>}
                      {dueToday && !t.completed && <Badge variant="accent" className="text-[10px] px-2 py-0.5">Hoy</Badge>}
                    </div>
                    {t.description && (<p className={["text-[12px] text-[var(--color-text-secondary)] truncate mt-0.5", t.completed ? "text-[var(--color-text-muted)]" : ""].filter(Boolean).join(" ")}>{t.description}</p>)}
                    <div className="flex items-center gap-3 mt-2">
                      {t.dueDate && (<span className="text-[11px] font-medium text-[var(--color-text-secondary)]">{formatTaskTime(t.dueDate, t.dueTime, 24) || "Sin hora"} {overdue ? "· atrasada" : ""}</span>)}
                      <span className={["px-2 py-0.5 rounded text-[10px] font-medium border", priorityColor(t.priority)].filter(Boolean).join(" ")}>{t.priority}</span>
                      {cat && (<span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)]"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} /> {cat.name}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(t.id); }} className="w-7 h-7 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent)] transition-all flex items-center justify-center" title="Editar"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }} className="w-7 h-7 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-alert)] transition-all flex items-center justify-center" title="Eliminar"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
                {t.subtasks.length > 0 && (<div className="mt-3 pt-3 border-t border-[var(--color-divider)]/50 space-y-1">{t.subtasks.map((s) => (<div key={s.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={s.completed} onChange={() => { saveDb((d) => ({ ...d, tasks: d.tasks.map((x) => x.id === t.id ? { ...x, subtasks: x.subtasks.map((u) => u.id === s.id ? { ...u, completed: !u.completed } : u) } : x) })); }} className="w-3 h-3 rounded border-[var(--color-border)] text-[var(--color-accent)] accent-[var(--color-accent)]" /><span className={["text-[var(--color-text-secondary)] truncate", s.completed ? "line-through" : ""].filter(Boolean).join(" ")}>{s.title}</span></div>))}</div>)}
              </Card>
            );
          })
        )}
      </div>

      <TaskFormModal open={open} onClose={closeModal} mode={editId ? "edit" : "create"} taskId={editId || undefined} onSuccess={() => { const wasEdit = !!editId; closeModal(); showToast(wasEdit ? "Tarea actualizada" : "Tarea creada", "success"); }} />

      <FAB onClick={() => setOpen(true)} />
    </div>
  );
}
