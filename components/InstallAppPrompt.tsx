"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PWAInstallContextValue = {
  installPrompt: InstallPromptEvent | null;
  installed: boolean;
  isIos: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

const PWAInstallContext = createContext<PWAInstallContextValue | null>(null);

export function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos] = useState(
    () => typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent),
  );

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => {
      const isStandalone =
        standaloneQuery.matches ||
        ("standalone" in navigator &&
          (navigator as Navigator & { standalone?: boolean }).standalone === true);
      setInstalled(isStandalone);
    };
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    updateInstalled();
    standaloneQuery.addEventListener("change", updateInstalled);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      standaloneQuery.removeEventListener("change", updateInstalled);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return "unavailable";
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome === "accepted") setInstalled(true);
    return outcome;
  };

  return (
    <PWAInstallContext.Provider
      value={{ installPrompt, installed, isIos, promptInstall }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
}

export default function InstallAppPrompt() {
  const pwaInstall = useContext(PWAInstallContext);
  if (!pwaInstall) {
    throw new Error("InstallAppPrompt must be rendered inside PWAInstallProvider");
  }

  const { installed, isIos, promptInstall } = pwaInstall;
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState("");

  const handleInstall = async () => {
    setError("");
    try {
      const outcome = await promptInstall();
      if (outcome !== "accepted") setShowInstructions(true);
    } catch {
      setError("No se pudo abrir la instalación. Intenta desde el menú del navegador.");
      setShowInstructions(true);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
        Instalar aplicación
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        Añade Planix a tu dispositivo para abrirla como una aplicación.
      </p>
      <Button onClick={handleInstall} className="w-full">
        {installed ? "Planix ya está instalada" : "Instalar Planix"}
      </Button>
      {error && (
        <p role="status" className="mt-3 text-sm text-[var(--color-alert)]">
          {error}
        </p>
      )}
      {!installed && showInstructions && (
        <p role="status" className="mt-3 text-sm text-[var(--color-text-secondary)]">
          {isIos
            ? 'En Safari, toca Compartir y luego "Añadir a pantalla de inicio".'
            : 'Abre el menú del navegador y selecciona "Instalar aplicación" o "Añadir a pantalla principal".'}
        </p>
      )}
    </Card>
  );
}
