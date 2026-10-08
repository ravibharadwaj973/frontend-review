export const inr = (n?: number | null) =>
  n == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const num = (n?: number | null, digits = 0) =>
  n == null || Number.isNaN(n) ? '—' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);

export function timeAgo(date?: string | Date | null) {
  if (!date) return '';
  const d = new Date(date);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} d ago`;
  if (days < 30) return `${Math.round(days / 7)} wk ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export const shortDate = (date?: string | Date | null) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
};

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

export const hours = (h?: number | null) => {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} days`;
};

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

/** "Wed 7 Oct, 3:40 pm" */
export const dayTime = (date?: string | Date | null) =>
  date ? new Date(date).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';

/** "Today", "Tomorrow", "Fri 9 Oct" */
export function relDay(date?: string | Date | null) {
  if (!date) return '—';
  const d = new Date(date);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(d) - start(new Date())) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const clock = (date?: string | Date | null) =>
  date ? new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';

/** "YYYY-MM-DD" → "Tue 20 Oct" without timezone surprises */
export const ymdLabel = (ymd: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', opts);
};

/** "today at 3:40 pm", "tomorrow at 11:00 am", "on Fri 9 Oct at 4:10 pm" */
export function when(date?: string | Date | null) {
  if (!date) return '';
  const r = relDay(date);
  const day = r === 'Today' || r === 'Tomorrow' || r === 'Yesterday' ? r.toLowerCase() : `on ${r}`;
  return `${day} at ${clock(date)}`;
}

/** ₹2,249.10 — keeps paise when there are any */
export const rupees = (n?: number | null) =>
  n == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
