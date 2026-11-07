"use client";

import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { key: "/dashboard", label: "Inicio", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" },
  { key: "/tasks", label: "Tareas", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { key: "/calendar", label: "Calendario", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2" },
  { key: "/alarms", label: "Alarmas", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "/settings", label: "Perfil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden" aria-label="Navegación principal">
      <div className="glass-nav rounded-[26px] p-1.5 flex items-stretch gap-1">
        {NAV.map((item) => {
          const isActive = pathname === item.key;
          return (
            <button
              key={item.key}
              onClick={() => router.push(item.key)}
              className={[
                "flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 rounded-[20px] transition-all duration-200",
                isActive
                  ? "nav-active"
                  : "text-[var(--color-text-secondary)] active:bg-[var(--color-surface-hover)]",
              ].filter(Boolean).join(" ")}
              aria-pressed={isActive}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              <span className="text-[9px] font-semibold leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
