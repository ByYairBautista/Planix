"use client";

import { useRouter } from "next/navigation";

export default function FAB({ onClick }: { onClick?: () => void }) {
  const router = useRouter();
  return (
    <button
      onClick={onClick || (() => router.push("/tasks/nueva"))}
      className="fixed right-4 md:right-8 bottom-24 md:bottom-8 z-50 w-14 h-14 rounded-[18px] text-white flex items-center justify-center transition-all duration-200 glow-accent hover:scale-105 active:scale-95"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,.34), rgba(255,255,255,.08) 48%, rgba(255,255,255,.02)), linear-gradient(135deg, rgba(46,58,89,.82), rgba(46,58,89,.82))", backdropFilter: "blur(20px) saturate(190%)", WebkitBackdropFilter: "blur(20px) saturate(190%)", border: "1px solid rgba(255,255,255,.55)" }}
      aria-label="Crear nuevo"
    >
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    </button>
  );
}
