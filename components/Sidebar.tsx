"use client";

import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/providers";
import { Avatar } from "@/components/ui";

const NAV = [
  { key: "/dashboard", label: "Inicio", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" },
  { key: "/tasks", label: "Tareas", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { key: "/reminders", label: "Recordatorios", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "/alarms", label: "Alarmas", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "/calendar", label: "Calendario", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2" },
  { key: "/stats", label: "Estadísticas", icon: "M18 20V14a2 2 0 00-2-2 2 2 0 00-2 2v6a2 2 0 002 2zm-6-10V8a2 2 0 00-2-2 2 2 0 00-2 2v6a2 2 0 002 2zM2 20v-8a2 2 0 012-2h3a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2z" },
];

export default function Sidebar({ className = "" }: { className?: string }) {
  const { user, theme, setTheme } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 hidden w-[268px] md:flex flex-col glass-panel border-y-0 border-l-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Barra lateral"
    >
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="w-10 h-10 rounded-2xl gradient-accent border border-white/40 flex items-center justify-center text-white font-extrabold text-lg shadow-[0_8px_20px_-6px_rgba(46,58,89,.65)] shrink-0 backdrop-blur-md">
          P
        </div>
        <div className="leading-tight min-w-0">
          <p className="font-extrabold tracking-tight text-[17px]">Planix</p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">Tu vida, en orden</p>
        </div>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="ml-auto w-9 h-9 rounded-xl bg-[var(--color-divider)] flex items-center justify-center text-[15px] shrink-0"
          aria-label="Cambiar tema"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

      <p className="px-6 pt-2 pb-2 text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--color-text-muted)]">Menú</p>
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto scrollbar-hide" aria-label="Navegación principal">
        {NAV.map((item) => {
          const isActive = pathname === item.key;
          return (
            <button
              key={item.key}
              onClick={() => router.push(item.key)}
              className={[
                "group w-full flex items-center gap-3 px-3.5 py-[11px] rounded-[14px] text-sm font-semibold transition-all duration-200",
                isActive
                  ? "nav-active"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={isActive}
            >
              <span className={[
                "w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-colors",
                isActive ? "bg-white/20 text-white" : "bg-[var(--color-divider)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)]",
              ].filter(Boolean).join(" ")}>
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              </span>
              {item.label}
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
          );
        })}
      </nav>

      <div className="p-3">
        <button
          onClick={() => router.push("/tasks/nueva")}
          className="btn btn-primary w-full mb-3"
        >
          <span className="text-lg leading-none">+</span> Nueva tarea
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--color-surface-hover)] transition-colors text-left"
        >
          <Avatar src={user.avatar || undefined} size="w-10 h-10" fallback={user.name.charAt(0).toUpperCase()} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold truncate">{user.name}</span>
            <span className="block text-[11px] text-[var(--color-text-secondary)] truncate">{user.email || "planix.app"}</span>
          </span>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-text-muted)] shrink-0"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </aside>
  );
}
