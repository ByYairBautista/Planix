"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Theme, User, Preference, DbData } from "@/lib/types";
import { getDb, setDb, demoUserId, seed } from "./storage";

interface AppContextType {
  db: DbData;
  userId: string;
  user: User;
  preferences: Preference;
  theme: Theme;
  setTheme: (t: Theme) => void;
  saveDb: (updater: (db: DbData) => DbData) => void;
  setUser: (u: Partial<User>) => void;
  setPreferences: (p: Partial<Preference>) => void;
  ready: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDbState] = useState<DbData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const d = getDb();
    setDbState(d);
    setReady(true);
  }, []);

  const current = db ?? seed;
  const userId = demoUserId();
  const user = current.user;
  const preferences = current.preferences;

  const [theme, setThemeState] = useState<Theme>(user.theme || "light");

  // Restaura el tema guardado cuando la BD cargada desde localStorage llega
  useEffect(() => {
    if (ready && user.theme) setThemeState(user.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const persist = useCallback((next: DbData) => {
    setDbState(next);
    setDb(() => next);
  }, []);

  const saveDb = useCallback((updater: (db: DbData) => DbData) => {
    persist(updater(current));
  }, [current, persist]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    saveDb((d) => ({ ...d, user: { ...d.user, theme: t } }));
  }, [saveDb]);

  const setUser = useCallback((u: Partial<User>) => {
    saveDb((d) => ({ ...d, user: { ...d.user, ...u } }));
  }, [saveDb]);

  const setPreferences = useCallback((p: Partial<Preference>) => {
    saveDb((d) => ({ ...d, preferences: { ...d.preferences, ...p } }));
  }, [saveDb]);

  const CtxProvider = AppContext.Provider;
  const value = { db: current, userId, user, preferences, theme, setTheme, saveDb, setUser, setPreferences, ready };
  return (
    <CtxProvider value={value}>
      {children}
    </CtxProvider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
