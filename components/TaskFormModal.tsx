"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/providers";
import { generateId } from "@/lib/storage";
import { nowIso } from "@/lib/date-utils";
import { Dialog, Button, Input, Textarea, Label, Checkbox, Select } from "@/components/ui";
import type { TaskRepeat } from "@/lib/types";

type Mode = "create" | "edit";

interface TaskFormModalProps {
  open: boolean; onClose: () => void; mode: Mode; taskId?: string; onSuccess: () => void;
}

const PRIORITIES = [
  { label: "Baja", value: "baja" as const },
  { label: "Media", value: "media" as const },
  { label: "Alta", value: "alta" as const },
  { label: "Urgente", value: "urgente" as const },
];

const REPEATS = [
  { label: "Ninguna", value: "none" },
  { label: "Diaria", value: "diaria" },
  { label: "Semanal", value: "semanal" },
  { label: "Mensual", value: "mensual" },
];

function isTaskRepeat(value: string): value is TaskRepeat {
  return REPEATS.some((repeat) => repeat.value === value);
}

export function TaskFormModal({ open, onClose, mode, taskId, onSuccess }: TaskFormModalProps) {
  const { db, user, saveDb } = useApp();
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<"baja" | "media" | "alta" | "urgente">("media");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [repeat, setRepeat] = useState<TaskRepeat>("none");

  // Populate the editor from the selected task whenever it opens.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && taskId) {
      const t = db.tasks.find((x) => x.id === taskId);
      if (t) {
        setTitle(t.title); setDescription(t.description); setDueDate(t.dueDate || ""); setDueTime(t.dueTime || "");
        setPriority(t.priority); setCategoryId(t.categoryId || ""); setTags(t.tags.join(", "));
        setNotes(t.notes); setFavorite(t.favorite); setRepeat(t.repeat); setSubtasks([...t.subtasks]);
      }
    } else {
      setTitle(""); setDescription(""); setDueDate(""); setDueTime("");
      setPriority("media"); setCategoryId(""); setTags(""); setNotes(""); setFavorite(false); setRepeat("none"); setSubtasks([]);
    }
  }, [open, mode, taskId, db]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const categories = db.categories.filter((c) => c.userId === user.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repeat !== "none" && !dueDate) {
      window.alert("Selecciona una fecha para crear una tarea recurrente.");
      return;
    }
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const now = nowIso();
    const resolvedId = mode === "edit" && taskId ? taskId : generateId("task");
    const existing = db.tasks.find((x) => x.id === taskId);
    const task = {
      id: resolvedId, userId: user.id, categoryId: categoryId || null, title, description,
      dueDate: dueDate || null, dueTime: dueTime || null, priority, completed: mode === "edit" ? existing?.completed ?? false : false,
      completedAt: null, favorite, tags: tagList, notes,
      subtasks: subtasks.map((s) => ({ id: s.id || generateId("st"), taskId: resolvedId, title: s.title, completed: s.completed })),
      repeat, repeatConfig: repeat === existing?.repeat ? existing.repeatConfig : null,
      createdAt: mode === "edit" ? existing?.createdAt ?? now : now, updatedAt: now,
    };
    saveDb((d) => {
      const next = { ...d };
      if (mode === "edit" && taskId) next.tasks = next.tasks.map((x) => x.id === taskId ? task : x);
      else next.tasks = [task, ...next.tasks];
      return next;
    });
    onClose(); onSuccess();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="max-h-[90vh]">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-[var(--color-text)]">{mode === "edit" ? "Editar tarea" : "Nueva tarea"}</h2>
        </div>

        <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus /></div>
        <div><Label>Descripción</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Detalles adicionales..." /></div>

        <div className="grid grid-cols-2 gap-4">
          <div><Label>Fecha de vencimiento</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div><Label>Hora</Label><Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} /></div>
        </div>

        <div><Label>Prioridad</Label><div className="flex gap-2">{PRIORITIES.map((p) => (
          <button key={p.value} type="button" onClick={() => setPriority(p.value)} className={[
            "flex-1 py-2.5 rounded-[var(--radius-sm)] border text-xs font-medium transition-all",
            priority === p.value ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]",
          ].filter(Boolean).join(" ")}>{p.label}</button>
        ))}</div></div>

        <div><Label>Categoría</Label><Select value={categoryId} onChange={setCategoryId} options={[{ label: "Sin categoría", value: "" }, ...categories.map((c) => ({ label: c.name, value: c.id }))]} /></div>
        <div><Label>Etiquetas (separadas por coma)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ej. urgente, trabajo" /></div>
        <div><Label>Notas</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notas internas..." /></div>

        <div className="flex items-center gap-3"><Checkbox checked={favorite} onChange={setFavorite} label="Marcar como favorita" /></div>

        <div><Label>Repetir</Label><Select value={repeat} onChange={(value) => {
          if (isTaskRepeat(value)) setRepeat(value);
        }} options={REPEATS.map((r) => ({ label: r.label, value: r.value }))} /></div>

        <div><Label>Subtareas</Label><div className="space-y-2">{subtasks.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2"><input type="text" value={s.title} onChange={(e) => { const n = [...subtasks]; n[i] = { ...n[i], title: e.target.value }; setSubtasks(n); }} className="flex-1 input text-sm" placeholder="Subtarea..." /><button type="button" onClick={() => setSubtasks(subtasks.filter((_, j) => j !== i))} className="text-[var(--color-text-muted)] hover:text-[var(--color-alert)] p-1" title="Eliminar"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>
        ))}<button type="button" onClick={() => setSubtasks([...subtasks, { id: generateId("st"), title: "", completed: false }])} className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Agregar subtarea</button></div></div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">{mode === "edit" ? "Guardar cambios" : "Crear tarea"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
