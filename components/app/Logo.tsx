import { cx } from '@/lib/format';

/** Starling mark: a bird in flight carrying a star. */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="16" fill={light ? '#ffffff' : '#1F5AD6'} />
        <path d="M14 38c8-2 14-9 18-20 2 8 8 14 18 15-9 3-15 9-18 17-3-6-9-10-18-12z" fill={light ? '#1F5AD6' : '#fff'} />
        <circle cx="44" cy="20" r="4" fill="#EFA00B" />
      </svg>
      <span className={cx('font-display text-[21px] font-bold tracking-tight', light ? 'text-white' : 'text-ink')}>starling</span>
    </span>
  );
}
