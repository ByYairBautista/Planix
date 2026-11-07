"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/providers";
import { Card, Badge, Input } from "@/components/ui";
import EmptyState from "@/components/EmptyState";

export default function SearchPage() {
  const { db, user } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const tasks = db.tasks.filter((t) => t.userId === user.id);
  const reminders = db.reminders.filter((r) => r.userId === user.id);
  const alarms = db.alarms.filter((a) => a.userId === user.id);
  const categories = db.categories.filter((c) => c.userId === user.id);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const r: Array<{ type: string; title: string; subtitle: string; id: string; onClick: () => void }> = [];
    tasks.forEach((t) => {
      if ((t.title || "").toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (Array.isArray(t.tags) ? t.tags : []).some((tag) => (tag || "").toLowerCase().includes(q))) {
        r.push({ type: "tarea", title: t.title, subtitle: t.description || "Sin descripción", id: t.id, onClick: () => router.push(`/tasks/editar?id=${encodeURIComponent(t.id)}`) });
      }
    });
    reminders.forEach((r_) => {
      if ((r_.title || "").toLowerCase().includes(q) || (r_.description || "").toLowerCase().includes(q)) {
        r.push({ type: "recordatorio", title: r_.title, subtitle: r_.description || "Sin descripción", id: r_.id, onClick: () => router.push("/reminders") });
      }
    });
    alarms.forEach((a) => {
      if ((a.name || "").toLowerCase().includes(q)) {
        r.push({ type: "alarma", title: a.name, subtitle: a.time, id: a.id, onClick: () => router.push("/alarms") });
      }
    });
    categories.forEach((c) => {
      if ((c.name || "").toLowerCase().includes(q)) {
        r.push({ type: "categoría", title: c.name, subtitle: c.icon, id: c.id, onClick: () => router.push("/tasks") });
      }
    });
    return r;
  }, [query, tasks, reminders, alarms, categories, router]);

  return (
    <div className="page section max-w-3xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Buscar</h1>
        <p className="text-[var(--color-text-secondary)]">Encuentra tareas, recordatorios, alarmas y categorías.</p>
      </div>

      <Card className="mb-6 p-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en Planix..."
          autoFocus
          className="text-lg"
        />
      </Card>

      {!query.trim() ? (
        <EmptyState
          title="Busca algo"
          subtitle="Escribe una palabra clave para encontrar tareas, recordatorios, alarmas o categorías."
          icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            {results.length} resultado{results.length !== 1 ? "s" : ""}
          </p>
          {results.length === 0 ? (
            <EmptyState
              title="Sin resultados"
              subtitle="No se encontró nada que coincida con tu búsqueda."
              icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          ) : (
            results.map((item) => (
              <Card key={item.id} className="p-4 flex items-center justify-between hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer" onClick={item.onClick}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--color-text-muted)] text-xs font-medium">{item.type}</span>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{item.title}</p>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">{item.subtitle}</p>
                </div>
                <Badge variant="accent" className="text-[10px]">Abrir</Badge>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
