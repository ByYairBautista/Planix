"use client";

import { useEffect, useState, useCallback } from "react";
import { Toast as ToastItem } from "@/components/ui";

export function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);

  const add = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id: string) => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, []);

  if (typeof window !== "undefined") {
    (window as any).__planixToast = { add, remove };
  }

  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => remove(t.id), t.type === "error" ? 6000 : 4000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, remove]);

  return (
    <div className="fixed bottom-24 right-6 md:bottom-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (<div key={t.id} className="pointer-events-auto"><ToastItem id={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} /></div>))}
    </div>
  );
}
