"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/providers";
import { generateId } from "@/lib/storage";
import { nowIso, parseHHmm } from "@/lib/date-utils";
import { playAlarmSound, stopAllSounds, requestAudio } from "@/lib/sounds";
import { Card, Button, Input, Badge, Label, Select, Switch } from "@/components/ui";
import { Dialog } from "@/components/ui";
import EmptyState from "@/components/EmptyState";
import FAB from "@/components/FAB";
import type { Alarm } from "@/lib/types";

const DAYS = [
  { n: 0, label: "Dom" }, { n: 1, label: "Lun" }, { n: 2, label: "Mar" },
  { n: 3, label: "Mié" }, { n: 4, label: "Jue" }, { n: 5, label: "Vie" }, { n: 6, label: "Sáb" },
];
const SOUNDS = [
  { value: "classic", label: "Clásica" }, { value: "gentle", label: "Suave" },
  { value: "calm", label: "Calma" }, { value: "beep", label: "Bip" },
];
const SNOOZE_MINUTES = [5, 10, 15] as const;

function nextTrigger(time: string, days: number[]): string | null {
  if (!days.length) return null;
  const { h, m } = parseHHmm(time);
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(h, m, 0, 0);
    if (days.includes(d.getDay()) && d.getTime() > now.getTime()) return d.toISOString();
  }
  return null;
}

export default function AlarmsPage() {
  const { db, user, saveDb } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [alarmActive, setAlarmActive] = useState<Alarm | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [alarmsWithNext, setAlarmsWithNext] = useState<Array<Alarm & { nextTrigger: string | null }>>([]);
  const [soonest, setSoonest] = useState<Alarm & { nextTrigger: string | null } | null>(null);
  const [soonestTimeLeft, setSoonestTimeLeft] = useState("--:--:--");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const alarms = useMemo(() => db.alarms.filter((a) => a.userId === user.id), [db, user.id]);

  const openEdit = useCallback((id: string) => { setEditId(id); setOpen(true); }, []);
  const closeModal = useCallback(() => { setOpen(false); setEditId(null); }, []);

  // Detiene el bucle si sales de la página mientras suena (sin pantalla para detenerlo)
  useEffect(() => {
    return () => { stopAllSounds(); };
  }, []);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      setCurrentTime(new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      // Respeta el posponer guardado si es más cercano que el horario regular
      const list = alarms.map((a) => {
        const regular = nextTrigger(a.time, a.days);
        const stored = a.nextTrigger;
        const trigger = stored && regular && new Date(stored).getTime() < new Date(regular).getTime() ? stored : (stored && !regular ? stored : regular);
        return { ...a, nextTrigger: trigger };
      });
      setAlarmsWithNext(list);
      const active = list.filter((a) => a.active && a.nextTrigger);
      let next: Alarm & { nextTrigger: string | null } | null = null;
      if (active.length) {
        next = active.reduce((prev, cur) => new Date(cur.nextTrigger!).getTime() < new Date(prev.nextTrigger!).getTime() ? cur : prev);
      }
      setSoonest(next);
      setSoonestTimeLeft(next ? timeUntil(next.nextTrigger) : "--:--:--");
      const due = list.find((a) => a.active && a.nextTrigger && new Date(a.nextTrigger!).getTime() <= now);
      if (due && !alarmActive) {
        const fullAlarm = db.alarms.find((a) => a.id === due.id);
        if (fullAlarm) {
          setAlarmActive(fullAlarm);
          playAlarmSound(fullAlarm.sound, fullAlarm.volume);
          const nt = nextTrigger(fullAlarm.time, fullAlarm.days);
          saveDb((d) => ({ ...d, alarms: d.alarms.map((a) => a.id === fullAlarm.id ? { ...a, nextTrigger: nt, updatedAt: nowIso() } : a) }));
        }
      }
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [alarms, db, saveDb, alarmActive]);

  const timeUntil = useCallback((iso: string | null) => {
    if (!iso) return "--:--:--";
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return "00:00:00";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, []);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type }); setTimeout(() => setToast(null), 4000);
  }, []);

  const toggleAlarm = useCallback((id: string) => {
    requestAudio();
    const a = db.alarms.find((x) => x.id === id);
    const active = !a?.active;
    saveDb((d) => ({ ...d, alarms: d.alarms.map((x) => x.id === id ? { ...x, active, updatedAt: nowIso() } : x) }));
    showToast(active ? "Alarma activada" : "Alarma desactivada", "success");
  }, [db, saveDb, showToast]);

  const handleSave = useCallback((data: {
    name: string; time: string; days: number[]; active: boolean; sound: string;
    volume: number; vibrate: boolean; duration: number; repeatCount: number; snoozeInterval: 5 | 10 | 15;
  }) => {
    const alarm: Alarm = {
      id: editId || generateId("alarm"), userId: user.id, time: data.time, days: data.days, active: data.active,
      name: data.name || "Alarma", sound: data.sound as any, volume: data.volume, vibrate: data.vibrate,
      duration: data.duration, repeatCount: data.repeatCount, snoozeInterval: data.snoozeInterval,
      nextTrigger: data.active ? nextTrigger(data.time, data.days) : null,
      createdAt: editId ? db.alarms.find((a) => a.id === editId)?.createdAt ?? nowIso() : nowIso(),
      updatedAt: nowIso(),
    };
    saveDb((d) => {
      const next = { ...d };
      if (editId) next.alarms = next.alarms.map((a) => a.id === editId ? alarm : a);
      else next.alarms = [alarm, ...next.alarms];
      return next;
    });
    setOpen(false); setEditId(null);
    showToast(editId ? "Alarma actualizada" : "Alarma creada", "success");
  }, [editId, user.id, saveDb, showToast]);

  const deleteAlarm = useCallback((id: string) => {
    if (!window.confirm("¿Eliminar esta alarma?")) return;
    saveDb((d) => ({ ...d, alarms: d.alarms.filter((a) => a.id !== id) }));
    showToast("Alarma eliminada", "success");
  }, [saveDb, showToast]);

  const stopAlarm = useCallback(() => { stopAllSounds(); setAlarmActive(null); }, []);

  const snoozeAlarm = useCallback(() => {
    if (!alarmActive) return;
    stopAllSounds();
    const interval = alarmActive.snoozeInterval;
    const d = new Date(); d.setMinutes(d.getMinutes() + interval);
    saveDb((d2) => ({ ...d2, alarms: d2.alarms.map((a) => a.id === alarmActive.id ? { ...a, nextTrigger: d.toISOString(), active: true, updatedAt: nowIso() } : a) }));
    setAlarmActive(null); showToast(`Posponido ${interval} min`, "success");
  }, [alarmActive, saveDb, showToast]);

  return (
    <div className="page section max-w-3xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Alarmas</h1>
          <p className="text-[var(--color-text-secondary)]">Despierta a tiempo con tus alarmas personalizadas.</p>
        </div>
        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => setOpen(true)}>+ Nueva alarma</Button></div>
      </div>

      {toast && (<div className="mb-4 px-4 py-3 rounded-[var(--radius)] bg-[#43A581]/10 border border-[#43A581]/20 text-[#2E7D58] text-sm fade-in">{toast.message}</div>)}

      {/* Soonest alarm banner */}
      {soonest && (
        <Card className="mb-8 p-6 bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/30 rounded-[var(--radius-lg)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">Próxima alarma</p>
              <p className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">{soonest.name}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{soonest.time} • {soonest.days.map((d) => DAYS.find((x) => x.n === d)!.label).join(", ")}</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[var(--color-accent)]">{soonestTimeLeft}</div>
              <p className="text-xs text-[var(--color-text-secondary)]">falta para sonar</p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {alarms.length === 0 ? (
          <EmptyState title="Sin alarmas" subtitle="Crea tu primera alarma para empezar el día a tiempo." icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" action={() => setOpen(true)} actionLabel="Crear alarma" />
        ) : (
          alarmsWithNext.map((a) => (
            <Card key={a.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-[var(--color-text)] truncate">{a.name}</p>
                  <Badge variant={a.active ? "success" : "neutral"} className="text-[10px] px-2 py-0.5">{a.active ? "Activa" : "Inactiva"}</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <span className="font-mono text-[var(--color-text)]">{a.time}</span>
                  <span className="text-[var(--color-text-secondary)]">{a.days.map((d) => DAYS.find((x) => x.n === d)!.label).join(", ")}</span>
                  {a.nextTrigger && (<span className="text-[var(--color-text-muted)]">· siguiente {timeUntil(a.nextTrigger)}</span>)}
                  <span className="text-[var(--color-text-secondary)]">🔊 {SOUNDS.find((s) => s.value === a.sound)?.label || a.sound}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={a.active} onChange={(v) => toggleAlarm(a.id)} />
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(a.id); }} className="w-7 h-7 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent)] transition-all flex items-center justify-center" title="Editar"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteAlarm(a.id); }} className="w-7 h-7 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-alert)] transition-all flex items-center justify-center" title="Eliminar"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <AlarmFormModal open={open} onClose={closeModal} editId={editId} onSave={handleSave} />

      {/* Alarm activated overlay */}
      {alarmActive && (
        <div className="fixed inset-0 z-[100] bg-black/[0.85] flex flex-col items-center justify-center p-6 text-white fade-in">
          <div className="max-w-md w-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[var(--color-alert)] pulse-dot" />
              <span className="text-sm font-medium text-white/70 uppercase tracking-wider">Alarma activada</span>
            </div>
            <h2 className="text-5xl font-bold mt-2 mb-2">{alarmActive.name}</h2>
            <div className="text-4xl font-mono font-bold mb-6">{currentTime}</div>
            <p className="text-white/70 mb-8">Es hora de atender tu compromiso.</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={stopAlarm} className="flex-1">Detener</Button>
              <Button variant="primary" onClick={snoozeAlarm} className="flex-1">Posponer {alarmActive.snoozeInterval} min</Button>
            </div>
          </div>
        </div>
      )}

      <FAB onClick={() => setOpen(true)} />
    </div>
  );
}

function AlarmFormModal({ open, onClose, editId, onSave }: { open: boolean; onClose: () => void; editId: string | null; onSave: (data: { name: string; time: string; days: number[]; active: boolean; sound: string; volume: number; vibrate: boolean; duration: number; repeatCount: number; snoozeInterval: 5 | 10 | 15; }) => void; }) {
  const { db } = useApp();
  const [name, setName] = useState("Alarma");
  const [time, setTime] = useState("07:00");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [active, setActive] = useState(true);
  const [sound, setSound] = useState("classic");
  const [volume, setVolume] = useState(0.8);
  const [vibrate, setVibrate] = useState(true);
  const [duration, setDuration] = useState(60);
  const [repeatCount, setRepeatCount] = useState(3);
  const [snoozeInterval, setSnoozeInterval] = useState<5 | 10 | 15>(5);

  useEffect(() => {
    if (!open) return;
    if (editId) {
      const a = db.alarms.find((x) => x.id === editId);
      if (a) { setName(a.name); setTime(a.time); setDays([...a.days]); setActive(a.active); setSound(a.sound); setVolume(a.volume); setVibrate(a.vibrate); setDuration(a.duration); setRepeatCount(a.repeatCount); setSnoozeInterval(a.snoozeInterval); }
    } else {
      setName("Alarma"); setTime("07:00"); setDays([1, 2, 3, 4, 5]); setActive(true); setSound("classic"); setVolume(0.8); setVibrate(true); setDuration(60); setRepeatCount(3); setSnoozeInterval(5);
    }
  }, [open, editId, db]);

  const toggleDay = (n: number) => { setDays((prev) => prev.includes(n) ? prev.filter((d) => d !== n) : [...prev, n].sort((a, b) => a - b)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!days.length) { alert("Selecciona al menos un día"); return; }
    onSave({ name, time, days, active, sound, volume: Number(volume.toFixed(1)), vibrate, duration, repeatCount, snoozeInterval });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between mb-2"><h2 className="text-lg font-bold text-[var(--color-text)]">{editId ? "Editar alarma" : "Nueva alarma"}</h2></div>

        <div><Label>Nombre de la alarma</Label><Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></div>
        <div><Label>Hora</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></div>

        <div><Label>Días de repetición</Label><div className="grid grid-cols-7 gap-2 mt-2">{DAYS.map((d) => {
          const sel = days.includes(d.n);
          return (<button key={d.n} type="button" onClick={() => toggleDay(d.n)} className={[
            "w-9 h-9 rounded-[var(--radius-sm)] border text-xs font-medium transition-all flex items-center justify-center",
            sel ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]",
          ].filter(Boolean).join(" ")} aria-pressed={sel}>{d.label}</button>);
        })}</div></div>

        <div className="flex items-center gap-4"><Switch checked={active} onChange={setActive} /><span className="text-sm font-medium text-[var(--color-text)]">Alarma activada</span></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Sonido</Label><Select value={sound} onChange={setSound} options={SOUNDS as any} /></div>
          <div><Label>Volumen</Label><input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full accent-[var(--color-accent)] h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer" /><span className="text-[10px] text-[var(--color-text-secondary)] block mt-1">{Math.round(volume * 100)}%</span></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label>Vibración</Label><Switch checked={vibrate} onChange={setVibrate} /></div>
          <div><Label>Duración (seg)</Label><Input type="number" value={String(duration)} onChange={(e) => setDuration(Number(e.target.value) || 30)} /></div>
          <div><Label>Veces a repetir</Label><Input type="number" value={String(repeatCount)} onChange={(e) => setRepeatCount(Number(e.target.value) || 1)} /></div>
        </div>

        <div><Label>Intervalo de posposición</Label><div className="flex gap-2">{SNOOZE_MINUTES.map((m) => (
          <button key={m} type="button" onClick={() => setSnoozeInterval(m)} className={[
            "flex-1 py-2 rounded-[var(--radius-sm)] border text-xs font-medium transition-all",
            snoozeInterval === m ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]",
          ].filter(Boolean).join(" ")}>{m} min</button>
        ))}</div></div>

        <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">{editId ? "Guardar alarma" : "Crear alarma"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
