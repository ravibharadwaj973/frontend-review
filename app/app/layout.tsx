'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { BarChart3, Building2, Home, LogOut, Menu, MessageSquareText, QrCode, Send, Settings, Users, X, RefreshCw } from 'lucide-react';
import { Logo } from '@/components/app/Logo';
import { Avatar, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cx } from '@/lib/format';

const NAV = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/app/reviews', label: 'Reviews', icon: MessageSquareText, badge: 'unanswered' },
  { href: '/app/requests', label: 'Review requests', icon: Send },
  { href: '/app/share', label: 'QR code & sharing', icon: QrCode },
  { href: '/app/customers', label: 'Customers', icon: Users },
  { href: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { section: 'Your presence' },
  { href: '/app/profile', label: 'Business profile', icon: Building2 },
  { href: '/app/google', label: 'Google profile', icon: RefreshCw },
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
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

  return (
    <div className="min-h-screen overflow-x-clip lg:pl-[264px]">
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
