import Link from 'next/link';
import { Logo } from './Logo';
import { Stars } from '@/components/ui';

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(420px,520px)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="w-fit"><Logo /></Link>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-[32px] font-semibold leading-tight text-ink">{title}</h1>
          <p className="mt-2 text-[15px] text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-ink-muted">{footer}</div>
          <p className="mt-10 flex gap-4 text-xs text-ink-faint">
            <Link href="/privacy-policy" className="hover:text-brand-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-600">Terms of Service</Link>
          </p>
        </div>
      </div>
      <aside className="relative hidden overflow-hidden bg-brand-700 lg:block">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <div className="max-w-sm rounded-2xl bg-white/95 p-5 text-ink shadow-pop">
            <Stars value={5} />
            <p className="mt-2 text-[15px] leading-relaxed">“Spotless salon and Leena explained every step of the facial. Booked my next one before leaving.”</p>
            <div className="mt-4 border-l-2 border-violet/50 pl-3 text-sm text-ink-soft">
              Thank you, Meera! We’re so glad the facial felt relaxing — see you next month.
            </div>
          </div>
          <p className="mt-10 max-w-sm font-display text-2xl font-semibold leading-snug">
            Replies like this used to take an evening a week. Now they take a coffee.
          </p>
        </div>
      </aside>
    </div>
  );
}
