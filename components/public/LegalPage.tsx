import Link from 'next/link';
import { Logo } from '@/components/app/Logo';
import { LEGAL } from '@/lib/legal';

export type Section = { id: string; title: string; body: React.ReactNode };

/** Shared layout for the Privacy Policy and Terms pages. */
export function LegalPage({ title, intro, sections }: { title: string; intro: React.ReactNode; sections: Section[] }) {
  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-line-soft bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/"><Logo /></Link>
          <nav className="flex gap-5 text-sm font-medium text-ink-soft">
            <Link href="/privacy-policy" className="hover:text-brand-600">Privacy</Link>
            <Link href="/terms" className="hover:text-brand-600">Terms</Link>
            <Link href="/login" className="hover:text-brand-600">Sign in</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-10 px-5 py-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-8 space-y-1 text-sm" aria-label="On this page">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-3 py-1.5 text-ink-muted hover:bg-white hover:text-brand-600">{s.title}</a>
            ))}
          </nav>
        </aside>
        <article className="min-w-0 rounded-xl2 bg-white px-6 py-8 shadow-lift sm:px-10">
          <h1 className="font-display text-[34px] font-semibold leading-tight">{title}</h1>
          <p className="mt-2 text-sm text-ink-muted">Effective {LEGAL.effectiveDate} · {LEGAL.website.replace('https://', '')}</p>
          <div className="legal mt-6 text-[15px] leading-relaxed text-ink-soft">{intro}</div>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="mt-9 scroll-mt-8">
              <h2 className="font-display text-xl font-semibold text-ink">{i + 1}. {s.title}</h2>
              <div className="legal mt-3 space-y-3 text-[15px] leading-relaxed text-ink-soft">{s.body}</div>
            </section>
          ))}
          <p className="mt-12 border-t border-line-soft pt-6 text-sm text-ink-muted">
            Questions? Email <a href={`mailto:${LEGAL.contactEmail}`} className="font-medium text-brand-600 hover:underline">{LEGAL.contactEmail}</a>.
          </p>
        </article>
      </main>
      <LegalFooter />
    </div>
  );
}

/** Small footer with the legal links, used across public pages. */
export function LegalFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-8 text-xs text-ink-muted ${className}`}>
      <span>© {new Date().getFullYear()} {LEGAL.product}</span>
      <Link href="/privacy-policy" className="hover:text-brand-600">Privacy Policy</Link>
      <Link href="/terms" className="hover:text-brand-600">Terms of Service</Link>
      <a href={`mailto:${LEGAL.contactEmail}`} className="hover:text-brand-600">Contact</a>
    </footer>
  );
}
