'use client';

import { cloneElement, createContext, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, Star, X, AlertCircle, Sparkles } from 'lucide-react';
import { cx, initials } from '@/lib/format';

/* ------------------------------------------------------------------ Button */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai' | 'inverse' | 'ghostInverse';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest },
  ref
) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-[background,color,box-shadow,transform] active:translate-y-px disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';
  const sizes = { sm: 'h-8 px-3 text-[13px] rounded-lg', md: 'h-10 px-4 text-sm rounded-xl', lg: 'h-12 px-6 text-[15px] rounded-xl' };
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-[inset_0_-2px_0_rgba(0,0,0,.18)]',
    secondary: 'bg-white text-ink border border-line hover:border-brand-200 hover:bg-brand-50',
    ghost: 'text-ink-soft hover:bg-brand-50 hover:text-brand-700',
    danger: 'bg-white text-rose border border-rose/30 hover:bg-rose-soft',
    ai: 'text-white bg-[length:200%_200%] animate-sheen shadow-[inset_0_-2px_0_rgba(0,0,0,.15)]',
    // For use on dark/blue backgrounds
    inverse: 'bg-white text-brand-700 hover:bg-brand-50 shadow-sm',
    ghostInverse: 'text-white/85 hover:bg-white/10 hover:text-white',
  };
  return (
    <button
      ref={ref}
      className={cx(base, sizes[size], variants[variant], className)}
      style={variant === 'ai' ? { backgroundImage: 'linear-gradient(115deg,#5b3fe0,#2f6fed 45%,#0ea5c6 80%,#5b3fe0)' } : undefined}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});

/* ------------------------------------------------------------------ Inputs */

export function Field({ label, hint, error, children, className }: { label?: string; hint?: React.ReactNode; error?: string; children: React.ReactNode; className?: string }) {
  const autoId = useId();
  // Link the label to the first form control so screen readers (and getByLabel) can find it
  const child = isValidElement(children) ? (children as React.ReactElement<any>) : null;
  const id = child?.props?.id || autoId;
  const describedBy = error || hint ? `${id}-desc` : undefined;
  const control = child ? cloneElement(child, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined }) : children;
  return (
    <div className={className}>
      {label && <label className="label" htmlFor={child ? id : undefined}>{label}</label>}
      {control}
      {error ? <p id={describedBy} className="mt-1 text-xs text-rose">{error}</p> : hint ? <p id={describedBy} className="hint">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cx('field', className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cx('field', className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...p }, ref) {
  return (
    <select ref={ref} className={cx('field appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27none%27 stroke=%27%235E6B85%27 stroke-width=%272%27%3E%3Cpath d=%27M2 4l4 4 4-4%27/%3E%3C/svg%3E")] bg-[right_.75rem_center] bg-no-repeat', className)} {...p}>
      {children}
    </select>
  );
});

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={cx('flex cursor-pointer items-start justify-between gap-6 py-3', disabled && 'opacity-50')}>
      <span>
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-500' : 'bg-line')}
      >
        <span className={cx('absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </label>
  );
}

/* ------------------------------------------------------------------ Display */

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} width={size} height={size} className={i <= Math.round(value) ? 'fill-star text-star' : 'fill-line text-line'} strokeWidth={1.5} />
      ))}
    </span>
  );
}

export function Badge({ tone = 'neutral', children, className }: { tone?: 'neutral' | 'good' | 'bad' | 'warn' | 'info' | 'ai'; children: React.ReactNode; className?: string }) {
  const tones = {
    neutral: 'bg-line-soft text-ink-soft',
    good: 'bg-leaf-soft text-leaf',
    bad: 'bg-rose-soft text-rose',
    warn: 'bg-amber-soft text-amber',
    info: 'bg-brand-50 text-brand-600',
    ai: 'bg-violet-soft text-violet',
  };
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', tones[tone], className)}>{children}</span>;
}

export function AiMark({ label = 'AI draft', className }: { label?: string; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs font-semibold', className)}>
      <Sparkles className="h-3.5 w-3.5 text-violet" />
      <span className="ai-sheen-text">{label}</span>
    </span>
  );
}

export function Avatar({ name, src, size = 36, className }: { name: string; src?: string; size?: number; className?: string }) {
  const hue = [...name].reduce((h, c) => (h + c.charCodeAt(0) * 7) % 360, 0);
  if (src) return <img src={src} alt="" width={size} height={size} className={cx('shrink-0 rounded-full object-cover', className)} style={{ width: size, height: size }} referrerPolicy="no-referrer" />;
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold', className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 45% 90%)`, color: `hsl(${hue} 45% 28%)` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('h-5 w-5 animate-spin text-brand-400', className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} />;
}

export function Empty({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {children && <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[28px] font-semibold leading-tight text-ink sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[15px] text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className, title, action, padded = true }: { children: React.ReactNode; className?: string; title?: React.ReactNode; action?: React.ReactNode; padded?: boolean }) {
  return (
    <section className={cx('min-w-0 rounded-xl2 border border-line-soft bg-paper shadow-lift', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-5">
          {typeof title === 'string' ? <h2 className="font-display text-[17px] font-semibold text-ink">{title}</h2> : title}
          {action}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

/** Segmented filter control with counts. */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="thin-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors',
            value === o.value ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-white'
          )}
        >
          {o.label}
          {o.count != null && <span className={cx('tabular text-xs', value === o.value ? 'text-brand-100' : 'text-ink-faint')}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Overlays */

export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }) {
  useEscape(open, onClose);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal aria-label={title} className={cx('flex max-h-[92vh] w-full animate-rise flex-col rounded-t-xl3 bg-paper shadow-pop sm:rounded-xl3', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <header className="flex items-center justify-between border-b border-line-soft px-6 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-mist" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>
        <div className="thin-scroll overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line-soft px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: React.ReactNode; label: string }) {
  useEscape(open, onClose);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-brand-900/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal aria-label={label} className="thin-scroll h-full w-full max-w-[640px] overflow-y-auto bg-mist shadow-pop" style={{ animation: 'rise .25s ease-out both' }}>
        {children}
      </aside>
    </div>,
    document.body
  );
}

function useEscape(active: boolean, fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && ref.current();
    window.addEventListener('keydown', h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = prev;
    };
  }, [active]);
}

/* ------------------------------------------------------------------ Toasts */

type Toast = { id: number; tone: 'good' | 'bad' | 'info'; message: string };
const ToastContext = createContext<(message: string, tone?: Toast['tone']) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast['tone'] = 'good') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'bad' ? 6000 : 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex animate-rise items-start gap-3 rounded-xl bg-brand-800 px-4 py-3 text-sm text-white shadow-pop">
            {t.tone === 'bad' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-soft" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-200" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
