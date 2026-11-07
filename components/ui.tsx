"use client";

import * as React from "react";

export function Button({
  children, className = "", variant = "primary", size = "md",
  disabled, onClick, type = "button", ...rest
}: {
  children?: React.ReactNode; className?: string;
  variant?: "primary" | "ghost" | "danger"; size?: "sm" | "md" | "lg";
  disabled?: boolean; onClick?: () => void; type?: "button" | "submit" | "reset";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "btn transition-all disabled:opacity-50 disabled:pointer-events-none disabled:transform-none";
  const variants: Record<string, string> = { primary: "btn-primary", ghost: "btn-ghost", danger: "btn-danger" };
  const sizes: Record<string, string> = { sm: "btn-sm", md: "btn-md", lg: "btn-lg" };
  return (
    <button type={type} className={[base, variants[variant], sizes[size], className].filter(Boolean).join(" ")} disabled={disabled} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={["input", className].filter(Boolean).join(" ")} {...props} />;
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={["input resize-none", className].filter(Boolean).join(" ")} {...props} />;
}

export function Badge({ children, className = "", variant = "neutral" }: { children?: React.ReactNode; className?: string; variant?: "success" | "alert" | "accent" | "neutral" | "baja" | "media" | "alta" | "urgente" }) {
  const map: Record<string, string> = {
    success: "badge-success", alert: "badge-alert", accent: "badge-accent", neutral: "badge-neutral",
    baja: "badge-neutral", media: "badge-accent", alta: "badge-alert", urgente: "badge-alert",
  };
  return <span className={["badge capitalize", map[variant] || map.neutral, className].filter(Boolean).join(" ")}>{children}</span>;
}

export function Card({ children, className = "", padding = "p-5", ...props }: any) {
  return <div className={["card", padding, className].filter(Boolean).join(" ")} {...props}>{children}</div>;
}

export function Label({ children, ...props }: any) { return <label className="label" {...props}>{children}</label>; }

export function Checkbox({ checked, onChange, className = "", label }: { checked: boolean; onChange: (b: boolean) => void; className?: string; label?: string }) {
  return (
    <label className={["flex items-center gap-2.5 cursor-pointer select-none", className].filter(Boolean).join(" ")}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="appearance-none w-[18px] h-[18px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] transition-all shrink-0" />
      {label && <span className="text-sm text-[var(--color-text)]">{label}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, className = "" }: { checked: boolean; onChange: (b: boolean) => void; className?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={["relative inline-block shrink-0 cursor-pointer select-none rounded-full border transition-all duration-300", checked ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "bg-[var(--color-surface-hover)] border-[var(--color-border)]", className].filter(Boolean).join(" ")}
      aria-checked={checked} role="switch" style={{ width: 46, height: 26 }}
    >
      <span
        className={["absolute top-[3px] left-[3px] rounded-full bg-white shadow transition-transform duration-300", checked ? "translate-x-[20px]" : "translate-x-0"].filter(Boolean).join(" ")}
        style={{ width: 18, height: 18 }}
      />
    </button>
  );
}

export function Select({ value, onChange, options, className = "" }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={["input appearance-none pr-10 cursor-pointer", className].filter(Boolean).join(" ")}>
      {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

export function Dialog({ open, onClose, children, className = "" }: { open: boolean; onClose: () => void; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md fade-in" onClick={onClose} />
      <div className={["fixed left-1/2 top-1/2 z-[70] -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[92dvh] overflow-y-auto glass-modal rounded-[24px] slide-up", className].filter(Boolean).join(" ")} role="dialog" aria-modal="true">
        <button onClick={onClose} className="sticky float-right m-3 mb-0 w-9 h-9 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] flex items-center justify-center hover:text-[var(--color-text)] transition-all z-10" aria-label="Cerrar">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="p-6 sm:p-7 clear-both">{children}</div>
      </div>
    </>
  );
}

export function Toast({ id, message, type = "success", onClose }: { id: string; message: string; type?: "success" | "error" | "info"; onClose: () => void }) {
  const colors: Record<string, string> = {
    success: "bg-[var(--color-success-light)] text-[#22755a] dark:text-[#7adbb2]",
    error: "bg-[var(--color-alert-light)] text-[#b8364a] dark:text-[#f49dab]",
    info: "bg-[var(--color-accent-light)] text-[#2e3a59] dark:text-[#b6c7d6]",
  };
  const icons: Record<string, string> = { success: "M5 13l4 4 10-10", error: "M6 6l12 12M6 18l12-12", info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" };
  return (
    <div className={["flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-[var(--color-glass-border)] glass-modal shadow-[var(--color-shadow-lg)] slide-up", colors[type]].filter(Boolean).join(" ")}>
      <span className="w-6 h-6 rounded-full bg-white/60 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d={icons[type]} /></svg>
      </span>
      <p className="text-sm font-medium leading-snug flex-1">{message}</p>
      <button onClick={onClose} className="w-6 h-6 shrink-0 opacity-70 hover:opacity-100" aria-label="Cerrar aviso"><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
    </div>
  );
}

export function EmptyState({ title, subtitle, icon, action, actionLabel }: { title: string; subtitle: string; icon: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="empty-illustration"><svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg></div>
      <h3 className="text-base font-bold text-[var(--color-text)]">{title}</h3>
      <p className="text-[var(--color-text-secondary)] mt-1.5 max-w-xs leading-relaxed text-[13px]">{subtitle}</p>
      {action && actionLabel && (<Button onClick={action} className="mt-6">{actionLabel}</Button>)}
    </div>
  );
}

export function Avatar({ src, size = "w-8 h-8", fallback, className = "" }: { src?: string; size?: string; fallback?: string; className?: string }) {
  return (
    <div className={["relative shrink-0", className].filter(Boolean).join(" ")}>
      {src ? (
        <img src={src} alt="" className={`${size} rounded-full object-cover ring-2 ring-[var(--color-glass-border)]`} />
      ) : (
        <div className={`${size} rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-hover))] flex items-center justify-center text-white font-bold ring-2 ring-[var(--color-glass-border)]`}>{fallback || "?"}</div>
      )}
    </div>
  );
}

function toneFor(color: string): { wrap: string; icon: string } {
  if (color.includes("accent")) return { wrap: "bg-[var(--color-accent-light)]", icon: "text-[var(--color-accent)]" };
  if (color.includes("success")) return { wrap: "bg-[var(--color-success-light)]", icon: "text-[var(--color-success)]" };
  if (color.includes("alert")) return { wrap: "bg-[var(--color-alert-light)]", icon: "text-[var(--color-alert)]" };
  if (color.includes("warning")) return { wrap: "bg-[var(--color-warning-light)]", icon: "text-[var(--color-warning)]" };
  return { wrap: "bg-[var(--color-divider)]", icon: "text-[var(--color-text-secondary)]" };
}

export function StatBadge({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const tone = toneFor(color);
  return (
    <div className="card card-hover p-4 sm:p-5 flex items-center gap-3.5">
      <div className={`w-11 h-11 rounded-2xl ${tone.wrap} flex items-center justify-center shrink-0`}>
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={tone.icon}><path d={icon} /></svg>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] truncate">{label}</p>
        <p className="text-[26px] leading-7 font-extrabold tracking-tight text-[var(--color-text)]">{value}</p>
      </div>
    </div>
  );
}
