"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/providers";
import type { Preference } from "@/lib/types";
import { Card, Button, Input, Label, Switch, Select } from "@/components/ui";
import InstallAppPrompt from "@/components/InstallAppPrompt";

export default function SettingsPage() {
  const { db, user, preferences, theme, setTheme, setUser, setPreferences, saveDb, ready } = useApp();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  // Sincroniza el formulario cuando la BD real termina de cargar
  // The profile form is initialized after local storage has loaded.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (ready) { setName(user.name); setEmail(user.email); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const showToast = useCallback((msg: string) => {
    setToast({ message: msg }); setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSaveProfile = useCallback((e: React.FormEvent) => {
    e.preventDefault(); setUser({ name, email }); showToast("Perfil actualizado");
  }, [name, email, setUser, showToast]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(db, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "planix-respaldo.json"; a.click();
    URL.revokeObjectURL(url); showToast("Datos exportados");
  }, [db, showToast]);

  const handleReset = useCallback(() => {
    if (!window.confirm("¿Restablecer tareas, recordatorios y alarmas? Esta acción no se puede deshacer.")) return;
    saveDb((d) => ({ ...d, tasks: [], reminders: [], alarms: [] }));
    showToast("Datos restablecidos");
  }, [saveDb, showToast]);

  const handleNotificationPreference = useCallback(async (enabled: boolean) => {
    if (enabled && "Notification" in window && Notification.permission === "default") {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          showToast("Los avisos aparecerán dentro de Planix mientras esté abierta.");
        }
      } catch {
        showToast("Los avisos aparecerán dentro de Planix mientras esté abierta.");
      }
    }
    setPreferences({ notifications: enabled });
  }, [setPreferences, showToast]);

  const setTimeFormat = (value: string) => {
    if (value === "12" || value === "24") {
      setPreferences({ timeFormat: Number(value) as Preference["timeFormat"] });
    }
  };

  const setWeekStart = (value: string) => {
    if (value === "0" || value === "1") {
      setPreferences({ firstDayOfWeek: Number(value) as Preference["firstDayOfWeek"] });
    }
  };

  return (
    <div className="page section max-w-md mx-auto px-4">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Configuración</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Ajusta Planix a tu gusto.</p>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Perfil</h2>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>Correo electrónico</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="flex items-center gap-3"><Switch checked={theme === "dark"} onChange={(v) => setTheme(v ? "dark" : "light")} /><span className="text-sm text-[var(--color-text)]">Modo oscuro</span></div>
          </div>
          <Button type="submit" variant="primary" className="w-auto">Guardar perfil</Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Preferencias</h2>
          <div className="space-y-4">
            <div><Label>Notificaciones</Label><Switch checked={preferences.notifications} onChange={handleNotificationPreference} /></div>
            <div><Label>Sonidos</Label><Switch checked={preferences.sounds} onChange={(v) => setPreferences({ sounds: v })} /></div>
            <div><Label>Formato de hora</Label><Select value={String(preferences.timeFormat)} onChange={setTimeFormat} options={[{ label: "24 horas", value: "24" }, { label: "12 horas", value: "12" }]} /></div>
            <div><Label>Primer día de la semana</Label><Select value={String(preferences.firstDayOfWeek)} onChange={setWeekStart} options={[{ label: "Lunes", value: "1" }, { label: "Domingo", value: "0" }]} /></div>
            <div><Label>Zona horaria</Label><Input value={preferences.timezone} onChange={(e) => setPreferences({ timezone: e.target.value })} /></div>
          </div>
        </Card>

        <InstallAppPrompt />

        <Card className="p-6">
          <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Datos y cuenta</h2>
          <div className="space-y-3">
            <Button variant="ghost" onClick={handleExport} className="w-full text-left">Exportar datos (JSON)</Button>
            <Button variant="ghost" onClick={handleReset} className="w-full text-left text-[var(--color-text-secondary)]">Restablecer datos</Button>
            <Button variant="danger" onClick={() => { localStorage.removeItem("planix_session"); router.push("/dashboard"); }} className="w-full">Cerrar sesión</Button>
          </div>
        </Card>
      </form>

      {toast && (<div className="mt-6 px-4 py-3 rounded-[var(--radius)] bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)] text-sm fade-in">{toast.message}</div>)}
    </div>
  );
}
