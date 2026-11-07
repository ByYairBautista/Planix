"use client";

import { Suspense } from "react";
import { AppProvider, useApp } from "@/lib/providers";
import { ToastContainer } from "@/components/Toast";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Avatar } from "@/components/ui";
import { PWAInstallProvider } from "@/components/InstallAppPrompt";

function MobileHeader() {
  const { user, theme, setTheme } = useApp();
  return (
    <header className="sticky top-0 z-30 md:hidden glass-nav border-x-0 border-t-0">
      <div className="flex items-center justify-between gap-3 px-4 h-14">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[10px] gradient-accent border border-white/40 flex items-center justify-center text-white font-extrabold text-[15px] shadow-[0_6px_16px_-4px_rgba(46,58,89,.6)] shrink-0 backdrop-blur-md">
            P
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-extrabold tracking-tight text-[15px] truncate">Planix</p>
            <p className="text-[11px] text-[var(--color-text-secondary)] truncate">Tu vida, en orden</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-[15px]"
            aria-label="Cambiar tema"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <Avatar src={user.avatar || undefined} size="w-9 h-9" fallback={user.name.charAt(0).toUpperCase()} />
        </div>
      </div>
    </header>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <PWAInstallProvider>
        <div className="min-h-dvh w-full">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
          <div className="md:pl-[268px] min-h-dvh flex flex-col min-w-0">
            <MobileHeader />
            <main className="flex-1 w-full min-w-0 pb-28 md:pb-10 pt-4 md:pt-0">{children}</main>
          </div>
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
        </div>
        <ToastContainer />
      </PWAInstallProvider>
    </AppProvider>
  );
}
