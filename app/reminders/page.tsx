"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/providers";
import { generateId } from "@/lib/storage";
import { nowIso, formatRelative, formatTime } from "@/lib/date-utils";
import { Card, Button, Input, Badge, Label, Select } from "@/components/ui";
import { Dialog } from "@/components/ui";
import EmptyState from "@/components/EmptyState";
import FAB from "@/components/FAB";

export default function RemindersPage() {
  const { db, user, saveDb } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const reminders = useMemo(() => db.reminders.filter((r) => r.userId === user.id), [db, user.id]);
  const tasks = db.tasks.filter((t) => t.userId === user.id);

  const filtered = useMemo(() => {
    return reminders.filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => a.datetime.localeCompare(b.datetime));
  }, [reminders, search]);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type }); setTimeout(() => setToast(null), 4000);
  }, []);

  const openEdit = useCallback((id: string) => { setEditId(id); setOpen(true); }, []);
  const closeModal = useCallback(() => { setOpen(false); setEditId(null); }, []);

  const markAttended = useCallback((id: string) => {
    saveDb((d) => ({ ...d, reminders: d.reminders.map((r) => r.id === id ? { ...r, attended: true, attendedAt: nowIso() } : r) }));
    showToast("Recordatorio marcado como atendido", "success");
  }, [saveDb, showToast]);

  const deleteReminder = useCallback((id: string) => {
    if (!window.confirm("¿Eliminar este recordatorio?")) return;
    saveDb((d) => ({ ...d, reminders: d.reminders.filter((r) => r.id !== id) }));
    showToast("Recordatorio eliminado", "success");
  }, [saveDb, showToast]);

  const postpone = useCallback((id: string, minutes: number) => {
    saveDb((d) => ({ ...d, reminders: d.reminders.map((r) => {
      if (r.id !== id) return r;
      const d2 = new Date(r.datetime); d2.setMinutes(d2.getMinutes() + minutes);
      return { ...r, datetime: d2.toISOString(), attended: false, attendedAt: null };
    }) }));
    showToast(`Pospuesto ${minutes} min`, "success");
  }, [saveDb, showToast]);

  const handleSave = useCallback((data: { title: string; description: string; datetime: string; anticipation: number; repeat: string; taskId: string | null; }) => {
    const reminder = { id: editId || generateId("rem"), userId: user.id, taskId: data.taskId, title: data.title, description: data.description, datetime: data.datetime, anticipation: data.anticipation, repeat: data.repeat as any, attended: false, attendedAt: null, createdAt: editId ? db.reminders.find((r) => r.id === editId)?.createdAt ?? nowIso() : nowIso() };
    saveDb((d) => { const next = { ...d }; if (editId) next.reminders = next.reminders.map((r) => r.id === editId ? reminder : r); else next.reminders = [reminder, ...next.reminders]; return next; });
    setOpen(false); setEditId(null); showToast(editId ? "Recordatorio actualizado" : "Recordatorio creado", "success");
  }, [editId, user.id, db, saveDb, showToast]);

  return (
    <div className="page section max-w-3xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Recordatorios</h1>
          <p className="text-[var(--color-text-secondary)]">Recibe avisos para no olvidar nada importante.</p>
        </div>
        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => setOpen(true)}>+ Nuevo recordatorio</Button></div>
      </div>

      {toast && (<div className="mb-4 px-4 py-3 rounded-[var(--radius)] bg-[#43A581]/10 border border-[#43A581]/20 text-[#2E7D58] text-sm fade-in">{toast.message}</div>)}

      <div className="mb-8"><Label>Buscar recordatorios</Label><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título..." /></div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState title="Sin recordatorios" subtitle="Crea un recordatorio para recibir un aviso en la fecha y hora que elijas." icon="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" action={() => setOpen(true)} actionLabel="Crear recordatorio" />
        ) : (
          filtered.map((r) => {
            const task = tasks.find((t) => t.id === r.taskId);
            const now = Date.now();
            const passed = new Date(r.datetime).getTime() < now && !r.attended;
            return (
              <Card key={r.id} className="p-4 flex items-start gap-3 border-l-4" style={{ borderLeftColor: passed ? "var(--color-alert)" : "var(--color-accent)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={["text-sm font-semibold", r.attended ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]", passed ? " text-[var(--color-alert)]" : ""].filter(Boolean).join(" ")}>{r.title}</p>
                    {r.attended && <Badge variant="success" className="text-[10px] px-2 py-0.5">Atendido</Badge>}
                    {passed && !r.attended && <Badge variant="alert" className="text-[10px] px-2 py-0.5">Vencido</Badge>}
                  </div>
                  {r.description && (<p className="text-[12px] text-[var(--color-text-secondary)] mb-2">{r.description}</p>)}
                  <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-secondary)] mb-2">
                    <span>📅 {formatRelative(r.datetime)}</span>
                    <span>⏰ {formatTime(r.datetime, 24)}</span>
                    {r.anticipation > 0 && <span>⏳ {r.anticipation} min antes</span>}
                    {task && <span>📋 {task.title}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!r.attended && (<Button variant="ghost" size="sm" onClick={() => markAttended(r.id)}>Marcar atendido</Button>)}
                    <div className="flex gap-1">{[5, 10, 15].map((m) => (
                      <button key={m} onClick={(e) => { e.stopPropagation(); postpone(r.id, m); }} className="w-6 h-6 rounded text-[10px] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)] transition-all" title={`Posponer ${m} min`}>{+m}</button>
                    ))}</div>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(r.id); }} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] p-1 transition-colors" title="Editar"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteReminder(r.id); }} className="text-[var(--color-text-muted)] hover:text-[var(--color-alert)] p-1 transition-colors" title="Eliminar"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <ReminderFormModal open={open} onClose={closeModal} editId={editId} onSave={handleSave} />

      <FAB onClick={() => setOpen(true)} />
    </div>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ReminderFormModal({ open, onClose, editId, onSave }: { open: boolean; onClose: () => void; editId: string | null; onSave: (data: { title: string; description: string; datetime: string; anticipation: number; repeat: string; taskId: string | null; }) => void; }) {
  const { db, user } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [datetime, setDatetime] = useState("");
  const [anticipation, setAnticipation] = useState(10);
  const [repeat, setRepeat] = useState("none");
  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editId) {
      const r = db.reminders.find((x) => x.id === editId);
      if (r) { setTitle(r.title); setDescription(r.description); setDatetime(toLocalInput(r.datetime)); setAnticipation(r.anticipation); setRepeat(r.repeat); setTaskId(r.taskId); }
    } else {
      setTitle(""); setDescription(""); setDatetime(""); setAnticipation(10); setRepeat("none"); setTaskId(null);
    }
  }, [open, editId, db]);

  const ANTICIPATIONS = [0, 5, 10, 15, 30, 60, 120];
  const REPEATS = [
    { label: "Ninguna", value: "none" }, { label: "Diario", value: "diaria" },
    { label: "Semanal", value: "semanal" }, { label: "Mensual", value: "mensual" },
  ];
  const tasks = db.tasks.filter((t) => t.userId === user.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !datetime) return;
    onSave({ title, description, datetime, anticipation, repeat, taskId });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text)]">{editId ? "Editar recordatorio" : "Nuevo recordatorio"}</h2>

        <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus /></div>
        <div><Label>Descripción</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" /></div>
        <div><Label>Fecha y hora</Label><Input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required /></div>
        <div><Label>Anticipación del aviso</Label><Select value={anticipation.toString()} onChange={(v) => setAnticipation(Number(v))} options={ANTICIPATIONS.map((a) => ({ label: a === 0 ? "Al momento" : `${a} min antes`, value: a.toString() }))} /></div>
        <div><Label>Repetición</Label><Select value={repeat} onChange={setRepeat} options={REPEATS.map(r => ({ label: r.label, value: r.value }))} /></div>
        <div><Label>Asociar a una tarea (opcional)</Label><Select value={taskId || ""} onChange={(v) => setTaskId(v || null)} options={[{ label: "Ninguna", value: "" }, ...tasks.map((t) => ({ label: t.title, value: t.id }))]} /></div>

        <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">{editId ? "Guardar" : "Crear recordatorio"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
