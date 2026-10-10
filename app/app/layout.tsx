'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { BarChart3, Building2, CalendarClock, CreditCard, HelpCircle, Home, Images, LogOut, Megaphone, Menu, MessageSquareText, PauseCircle, QrCode, Send, Settings, Shield, Sparkles, Users, X, RefreshCw } from 'lucide-react';
import { BillingView } from '@/components/app/BillingView';
import { Logo } from '@/components/app/Logo';
import { Avatar, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cx } from '@/lib/format';

const NAV = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/app/reviews', label: 'Reviews', icon: MessageSquareText, badge: 'unanswered' },
  { href: '/app/generated-reviews', label: 'Generated reviews', icon: Sparkles },
  { href: '/app/requests', label: 'Review requests', icon: Send },
  { href: '/app/share', label: 'QR code & sharing', icon: QrCode },
  { href: '/app/customers', label: 'Customers', icon: Users },
  { href: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { section: 'Keep Google active' },
  { href: '/app/autopilot', label: 'Autopilot', icon: CalendarClock },
  { href: '/app/posts', label: 'Google posts', icon: Megaphone },
  { href: '/app/photos', label: 'Weekly photos', icon: Images },
  { href: '/app/questions', label: 'Customer questions', icon: HelpCircle },
  { section: 'Your presence' },
  { href: '/app/profile', label: 'Business profile', icon: Building2 },
  { href: '/app/google', label: 'Google profile', icon: RefreshCw },
  { href: '/app/billing', label: 'Billing', icon: CreditCard },
  { href: '/app/settings', label: 'Settings', icon: Settings },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, business, logout } = useAuth();
  const { data: counts } = useSWR('/reviews?limit=1', { refreshInterval: 60_000 });
  const { data: google } = useSWR('/google/status');
  const unanswered = counts?.counts?.unanswered ?? 0;

  return (
    <div className="flex h-full flex-col bg-brand-800 text-brand-100">
      <div className="px-5 pb-6 pt-6">
        <Link href="/app" onClick={onNavigate}><Logo light /></Link>
      </div>

      <div className="mx-3 mb-5 rounded-xl bg-white/[0.06] px-3 py-3">
        <p className="truncate font-display text-[15px] font-semibold text-white">{business?.name || '—'}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-200">
          <span className={cx('h-1.5 w-1.5 rounded-full', google?.account ? (google.account.mode === 'demo' ? 'bg-star' : 'bg-[#5BD49A]') : 'bg-brand-400')} />
          {google?.account ? (google.account.mode === 'demo' ? 'Demo Google connection' : 'Google connected') : 'Google not connected'}
        </p>
      </div>

      <nav className="thin-scroll flex-1 overflow-y-auto px-3" aria-label="Main">
        {NAV.map((item, i) => {
          if ('section' in item) return <p key={i} className="mb-1.5 mt-6 px-3 text-xs font-medium text-brand-200/70">{item.section}</p>;
          const active = item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'group mb-0.5 flex h-10 items-center gap-3 rounded-lg px-3 text-[14.5px] transition-colors',
                active ? 'bg-white text-brand-700 font-medium' : 'text-brand-100 hover:bg-white/[0.07] hover:text-white'
              )}
            >
              <Icon className={cx('h-[18px] w-[18px]', active ? 'text-brand-500' : 'text-brand-200')} />
              <span className="flex-1">{item.label}</span>
              {'badge' in item && unanswered > 0 && (
                <span className={cx('rounded-full px-1.5 text-xs font-semibold tabular', active ? 'bg-brand-600 text-white' : 'bg-star text-brand-900')}>{unanswered}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
        <Avatar name={user?.name || ''} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-brand-200">{user?.email}</p>
        </div>
        <button onClick={logout} className="rounded-lg p-2 text-brand-200 hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Shown instead of the app while an admin has paused the account. */
function PausedScreen() {
  const { business, logout } = useAuth();
  return (
    <div className="min-h-screen bg-mist px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-8 flex items-center justify-between"><Logo /><button onClick={logout} className="text-sm font-medium text-ink-muted hover:text-brand-600">Sign out</button></div>
        <div className="mb-8 flex flex-col gap-4 rounded-xl2 border border-rose/20 bg-white p-6 shadow-lift sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-soft text-rose"><PauseCircle className="h-6 w-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-semibold">{business?.name}’s account is paused</h1>
            <p className="mt-1 text-[15px] text-ink-muted">{(business?.account?.suspendedReason || 'Contact us to continue').replace(/[.!]?$/, '.')} Your data is safe. Review replies, photos and posts are on hold, and your review page is offline until the account is active again.</p>
          </div>
        </div>
        <BillingView />
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, business, impersonatedBy, stopImpersonating, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => setOpen(false), [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // e.g. an admin-only login: the business app needs a business
  if (!business) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <Logo />
        <h1 className="mt-4 font-display text-2xl font-semibold">No business on this account</h1>
        <p className="max-w-sm text-ink-muted">{user.isAdmin ? 'This is an admin account. Use the ReviewRankr admin website to manage businesses.' : 'Sign up with a business to use ReviewRankr.'}</p>
        <button onClick={logout} className="font-medium text-brand-600 hover:underline">Sign out</button>
      </div>
    );
  }

  if (business?.account?.status === 'suspended' && !impersonatedBy) return <PausedScreen />;

  return (
    <div className="min-h-screen overflow-x-clip lg:pl-[264px]">
      {impersonatedBy && (
        <div className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-3 bg-ink px-4 py-2 text-sm text-white">
          <Shield className="h-4 w-4 text-brand-200" />
          <span>Admin view — you’re inside <span className="font-semibold">{business?.name}</span>{business?.account?.status === 'suspended' ? ' (paused)' : ''}. Changes you make are saved to this account.</span>
          <button onClick={stopImpersonating} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-brand-50">Back to admin</button>
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line-soft bg-mist/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-white" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-brand-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-rise">
            <Sidebar onNavigate={() => setOpen(false)} />
            <button onClick={() => setOpen(false)} className="absolute right-3 top-6 rounded-lg p-1.5 text-white hover:bg-white/10" aria-label="Close menu"><X className="h-5 w-5" /></button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1240px] px-4 pb-20 pt-6 sm:px-8 lg:pt-10">{children}</main>
    </div>
  );
}
