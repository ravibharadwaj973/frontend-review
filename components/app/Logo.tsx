import { cx } from '@/lib/format';

/** ReviewRankr mark: rising bars (your ranking) topped with a review star. */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  const bar = light ? '#1F5AD6' : '#fff';
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="16" fill={light ? '#ffffff' : '#1F5AD6'} />
        <rect x="13" y="40" width="9" height="11" rx="2" fill={bar} opacity={0.75} />
        <rect x="27.5" y="33" width="9" height="18" rx="2" fill={bar} opacity={0.9} />
        <rect x="41" y="29" width="9" height="22" rx="2" fill={bar} />
        <path d="M45.5 9.5 L47.7 14.9 L53.6 15.4 L49.1 19.2 L50.5 24.9 L45.5 21.8 L40.5 24.9 L41.9 19.2 L37.4 15.4 L43.3 14.9Z" fill="#EFA00B" stroke="#EFA00B" strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
      <span className={cx('font-display text-[21px] font-bold tracking-tight', light ? 'text-white' : 'text-ink')}>
        review<span className={light ? 'text-white/75' : 'text-brand-600'}>rankr</span>
      </span>
    </span>
  );
}
