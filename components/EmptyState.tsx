"use client";

import { Button } from "@/components/ui";

export default function EmptyState({ title, subtitle, icon, action, actionLabel }: { title: string; subtitle: string; icon: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-divider)] flex items-center justify-center mb-6 text-[var(--color-text-muted)]">
        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="text-[var(--color-text-secondary)] mt-2 max-w-xs leading-relaxed">{subtitle}</p>
      {action && actionLabel && (<Button onClick={action} className="mt-7">{actionLabel}</Button>)}
    </div>
  );
}
