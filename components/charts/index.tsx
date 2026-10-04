'use client';

import { useMemo, useRef, useState } from 'react';
import { cx, monthLabel, num } from '@/lib/format';

/* Shared tooltip ---------------------------------------------------------- */

function Tip({ x, y, children, width }: { x: number; y: number; children: React.ReactNode; width: number }) {
  const left = Math.min(Math.max(x, 70), width - 70);
  return (
    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-brand-800 px-3 py-2 text-xs text-white shadow-pop" style={{ left, top: y - 8 }}>
      {children}
    </div>
  );
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(300);
  const observe = (el: HTMLDivElement | null) => {
    (ref as any).current = el;
    if (!el || (el as any)._ro) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.floor(e.contentRect.width))));
    ro.observe(el);
    (el as any)._ro = ro;
  };
  return [observe, w] as const;
}

/* Monthly volume: single-series bars -------------------------------------- */

type Point = { month: string; count: number; avgRating: number | null; cumulativeAvg: number | null };

export function MonthlyBars({ series, height = 168 }: { series: Point[]; height?: number }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 28, r: 4, t: 10, b: 24 };
  const max = Math.max(4, ...series.map((s) => s.count));
  const niceMax = Math.ceil(max / 4) * 4;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const slot = innerW / series.length;
  const barW = Math.min(28, slot - 6);
  const y = (v: number) => pad.t + innerH - (v / niceMax) * innerH;
  const ticks = [0, niceMax / 2, niceMax];

  return (
    <div ref={ref} className="relative w-full min-w-0 overflow-hidden" onMouseLeave={() => setHover(null)}>
      <svg width={width} height={height} role="img" aria-label="Reviews received per month">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="#E9EEF6" strokeDasharray={t === 0 ? undefined : '2 4'} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-ink-faint text-[10px] tabular">{t}</text>
          </g>
        ))}
        {series.map((s, i) => {
          const x = pad.l + i * slot + (slot - barW) / 2;
          const h = Math.max(s.count ? 2 : 0, innerH - (y(s.count) - pad.t));
          const top = pad.t + innerH - h;
          const r = Math.min(4, barW / 2, h);
          const last = i === series.length - 1;
          return (
            <g key={s.month}>
              <rect x={pad.l + i * slot} y={pad.t} width={slot} height={innerH} fill="transparent" tabIndex={0} aria-label={`${monthLabel(s.month)}: ${s.count} reviews`}
                onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} />
              {h > 0 && (
                <path
                  d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
                  className={cx('pointer-events-none transition-opacity', last ? 'fill-brand-200' : 'fill-brand-400')}
                  opacity={hover == null || hover === i ? 1 : 0.45}
                />
              )}
              <text x={pad.l + i * slot + slot / 2} y={height - 6} textAnchor="middle" className="pointer-events-none fill-ink-faint text-[10px]">
                {i % (width < 420 ? 2 : 1) === 0 || last ? monthLabel(s.month) : ''}
              </text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <Tip x={pad.l + hover * slot + slot / 2} y={y(series[hover].count)} width={width}>
          <div className="font-display text-sm font-semibold tabular">{series[hover].count} reviews</div>
          <div className="text-brand-100">
            {monthLabel(series[hover].month)} {series[hover].month.slice(0, 4)}
            {series[hover].avgRating != null && ` · avg ${series[hover].avgRating}★`}
            {hover === series.length - 1 && ' · month so far'}
          </div>
        </Tip>
      )}
    </div>
  );
}

/* Rating over time: single line with crosshair ---------------------------- */

export function RatingLine({ series, height = 120, compact }: { series: Point[]; height?: number; compact?: boolean }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const pts = series.map((s, i) => ({ i, v: s.cumulativeAvg })).filter((p) => p.v != null) as { i: number; v: number }[];
  const pad = compact ? { l: 4, r: 8, t: 8, b: 6 } : { l: 28, r: 8, t: 12, b: 10 };
  const lo = Math.max(1, Math.floor((Math.min(...pts.map((p) => p.v), 5) - 0.2) * 2) / 2);
  const hi = 5;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - ((v - lo) / (hi - lo || 1)) * innerH;
  const d = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left;
    let best = 0;
    let dist = Infinity;
    pts.forEach((p, k) => {
      const dd = Math.abs(x(p.i) - rel);
      if (dd < dist) { dist = dd; best = k; }
    });
    setHover(best);
  };
  if (!pts.length) return <div className="flex h-24 items-center text-sm text-ink-muted">Not enough reviews yet.</div>;
  const hp = hover != null ? pts[hover] : null;
  const last = pts[pts.length - 1];
  return (
    <div ref={ref} className="relative w-full min-w-0">
      <svg width={width} height={height} className="block" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label={`Average rating over time, now ${last.v}`}>
        {!compact && [lo, (lo + hi) / 2, hi].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="#E9EEF6" strokeDasharray="2 4" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-ink-faint text-[10px] tabular">{t.toFixed(1)}</text>
          </g>
        ))}
        <path d={d} fill="none" stroke="#1F5AD6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(last.i)} cy={y(last.v)} r={4.5} fill="#1F5AD6" stroke="#fff" strokeWidth={2} />
        {hp && (
          <>
            <line x1={x(hp.i)} x2={x(hp.i)} y1={pad.t} y2={height - pad.b} stroke="#94A0B7" strokeWidth={1} />
            <circle cx={x(hp.i)} cy={y(hp.v)} r={4.5} fill="#fff" stroke="#1F5AD6" strokeWidth={2} />
          </>
        )}
      </svg>
      {hp && (
        <Tip x={x(hp.i)} y={y(hp.v)} width={width}>
          <div className="font-display text-sm font-semibold tabular">{hp.v.toFixed(2)} ★</div>
          <div className="text-brand-100">Overall rating, end of {monthLabel(series[hp.i].month)}</div>
        </Tip>
      )}
    </div>
  );
}

/* Rating distribution: one hue, magnitude --------------------------------- */

export function RatingDistribution({ distribution, onSelect }: { distribution: Record<string, number>; onSelect?: (stars: number) => void }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
  const max = Math.max(...Object.values(distribution), 1);
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((s) => {
        const n = distribution[s] || 0;
        return (
          <button key={s} onClick={() => onSelect?.(s)} className="group flex w-full items-center gap-3 rounded-md py-0.5 text-left" title={`${n} reviews (${Math.round((n / total) * 100)}%)`}>
            <span className="w-6 shrink-0 text-xs font-medium tabular text-ink-muted">{s}★</span>
            <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-line-soft">
              <span className="absolute inset-y-0 left-0 rounded-full bg-star transition-[width] group-hover:brightness-95" style={{ width: `${(n / max) * 100}%` }} />
            </span>
            <span className="w-14 shrink-0 text-right text-xs tabular text-ink-soft">
              {n} <span className="text-ink-faint">· {Math.round((n / total) * 100)}%</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* What customers praise vs criticise: diverging bars ---------------------- */

type Topic = { topic: string; count: number; recent?: number; avgRating?: number };

export function TopicBalance({ praised, criticized, onSelect }: { praised: Topic[]; criticized: Topic[]; onSelect?: (topic: string) => void }) {
  const rows = useMemo(() => {
    const names = new Map<string, { topic: string; good: number; bad: number }>();
    for (const t of praised) names.set(t.topic, { topic: t.topic, good: t.count, bad: 0 });
    for (const t of criticized) {
      const e = names.get(t.topic) || { topic: t.topic, good: 0, bad: 0 };
      e.bad = t.count;
      names.set(t.topic, e);
    }
    return [...names.values()].sort((a, b) => b.good + b.bad - (a.good + a.bad)).slice(0, 7);
  }, [praised, criticized]);
  const max = Math.max(1, ...rows.map((r) => Math.max(r.good, r.bad)));
  if (!rows.length) return <p className="py-6 text-sm text-ink-muted">Themes appear once reviews have been analysed.</p>;
  return (
    <div>
      <div className="mb-2 grid grid-cols-[1fr_minmax(110px,170px)_1fr] items-center gap-3 text-xs font-medium text-ink-muted">
        <span className="flex items-center justify-end gap-1.5"><span className="h-2 w-3 rounded-sm bg-critique" />Criticised</span>
        <span />
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-praise" />Praised</span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.topic}>
            <button onClick={() => onSelect?.(r.topic)} className="group grid w-full grid-cols-[1fr_minmax(110px,170px)_1fr] items-center gap-3 rounded-lg py-1 hover:bg-mist">
              <span className="flex items-center justify-end gap-2">
                {r.bad > 0 && <span className="text-xs tabular text-ink-soft">{r.bad}</span>}
                <span className="h-3 rounded-l-[4px] rounded-r-[1px] bg-critique" style={{ width: `${(r.bad / max) * 100}%`, minWidth: r.bad ? 3 : 0 }} />
              </span>
              <span className="truncate text-center text-[13px] font-medium text-ink group-hover:text-brand-600">{r.topic}</span>
              <span className="flex items-center gap-2">
                <span className="h-3 rounded-l-[1px] rounded-r-[4px] bg-praise" style={{ width: `${(r.good / max) * 100}%`, minWidth: r.good ? 3 : 0 }} />
                {r.good > 0 && <span className="text-xs tabular text-ink-soft">{r.good}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Review-request funnel --------------------------------------------------- */

export function Funnel({ steps }: { steps: { label: string; value: number; note?: string }[] }) {
  const max = Math.max(1, steps[0]?.value || 1, ...steps.map((s) => s.value));
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const rate = prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <li key={s.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-ink">{s.label}</span>
              <span className="tabular text-ink-soft">
                <span className="font-display text-base font-semibold text-ink">{num(s.value)}</span>
                {rate != null && <span className="ml-2 text-xs text-ink-muted">{rate}% of previous</span>}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-line-soft">
              <div className="h-full rounded-full" style={{ width: `${(s.value / max) * 100}%`, minWidth: s.value ? 6 : 0, background: ['#B6D0FC', '#4F8EF7', '#2F6FED', '#1F5AD6'][i] || '#1F5AD6' }} />
            </div>
            {s.note && <p className="mt-1 text-xs text-ink-muted">{s.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/* Sentiment strip: share of positive/neutral/negative ---------------------- */

export function SentimentStrip({ sentiment }: { sentiment: Record<string, number> }) {
  const parts = [
    { key: 'positive', label: 'Positive', color: '#1E86A8' },
    { key: 'mixed', label: 'Mixed', color: '#94A0B7' },
    { key: 'neutral', label: 'Neutral', color: '#CBD5E3' },
    { key: 'negative', label: 'Negative', color: '#D3553A' },
  ];
  const total = parts.reduce((s, p) => s + (sentiment[p.key] || 0), 0) || 1;
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {parts.map((p) => (sentiment[p.key] ? <span key={p.key} title={`${p.label}: ${sentiment[p.key]}`} style={{ width: `${(sentiment[p.key] / total) * 100}%`, background: p.color }} /> : null))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        {parts.map((p) => (
          <span key={p.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
            {p.label} <span className="tabular font-medium text-ink-soft">{sentiment[p.key] || 0}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
