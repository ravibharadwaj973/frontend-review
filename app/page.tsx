'use client';

import Link from 'next/link';
import { LegalFooter } from '@/components/public/LegalPage';
import { useEffect, useState } from 'react';
import { Check, MessageCircle, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '@/components/app/Logo';
import { Stars, AiMark } from '@/components/ui';
import { TopicBalance } from '@/components/charts';
import { useAuth } from '@/lib/auth';

const DRAFT =
  "Hi Rohan, thank you for the kind words about your haircut — we're glad Simran got it just right. You're right about the wait, and we're sorry. We've added a buffer between weekend bookings so it doesn't happen again.";

/** The hero's one orchestrated moment: a review arrives, gets read, and an answer is drafted. */
function LiveReply() {
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setPhase(3);
      setTyped(DRAFT.length);
      return;
    }
    const timers = [setTimeout(() => setPhase(1), 700), setTimeout(() => setPhase(2), 1700), setTimeout(() => setPhase(3), 2500)];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase < 3 || typed >= DRAFT.length) return;
    const t = setTimeout(() => setTyped((n) => Math.min(DRAFT.length, n + 3)), 18);
    return () => clearTimeout(t);
  }, [phase, typed]);

  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      {/* incoming review */}
      <div className="relative rounded-xl3 bg-white p-5 shadow-pop">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8DDF7] font-display font-semibold text-[#4B2E83]">RJ</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">Rohan Joshi</p>
            <p className="text-xs text-ink-muted">Google review · 2 min ago</p>
          </div>
          <Stars value={4} />
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Haircut was great, Simran really listened. But I had to wait 30 minutes even with an appointment.
        </p>
        <div className={`mt-4 flex flex-wrap gap-1.5 transition-opacity duration-500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-ink-soft">Mixed</span>
          <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-ink-soft">Haircut</span>
          <span className="rounded-full bg-praise-soft px-2.5 py-1 text-xs font-medium text-[#14607A]">+ Stylist</span>
          <span className="rounded-full bg-critique-soft px-2.5 py-1 text-xs font-medium text-[#A33B22]">− Waiting time</span>
        </div>
      </div>

      {/* drafted reply */}
      <div className={`ai-sheen relative -mt-3 ml-6 rounded-xl3 p-5 shadow-lift transition-all duration-500 sm:ml-12 ${phase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
        <AiMark label="Reply drafted in your voice" />
        <p className="mt-2 min-h-[96px] text-[14.5px] leading-relaxed text-ink">
          {DRAFT.slice(0, typed)}
          {typed < DRAFT.length && phase >= 3 && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-brand-500" />}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-ink-muted">Nothing is posted until you approve</span>
          <span className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors ${typed >= DRAFT.length ? 'bg-brand-600 text-white' : 'bg-line-soft text-ink-faint'}`}>
            <Check className="h-3.5 w-3.5" /> Approve & publish
          </span>
        </div>
      </div>
    </div>
  );
}

const LOOP = [
  { title: 'A customer finishes a visit', body: 'Add them in seconds, or import your client list.' },
  { title: 'You send a personal request', body: 'Written for their service, opened in your own WhatsApp, SMS or email.' },
  { title: 'They write an honest review', body: 'They tap the services they had and what stood out. ReviewRankr helps put it into simple words, they edit it, and post it on Google.' },
  { title: 'ReviewRankr reads it and drafts a reply', body: 'Sentiment, services and issues are picked out; you edit and approve.' },
  { title: 'Patterns turn into fixes', body: 'See which complaints repeat, by service, month over month.' },
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-mist">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/app" className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Open dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="hidden h-10 items-center rounded-xl px-4 text-sm font-medium text-ink-soft hover:text-brand-600 sm:inline-flex">Sign in</Link>
              <Link href="/signup" className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Start free</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div>
          <h1 className="font-display text-[44px] font-semibold leading-[1.02] text-ink sm:text-[64px]">
            Ask every customer.
            <br />
            Answer every review.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-soft">
            ReviewRankr helps salons, clinics, gyms and restaurants collect genuine Google reviews after each visit, reply to them in minutes with AI drafts you approve, and see what customers keep praising — or complaining about.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="inline-flex h-12 items-center rounded-xl bg-brand-600 px-6 text-[15px] font-medium text-white shadow-[inset_0_-2px_0_rgba(0,0,0,.18)] hover:bg-brand-700">
              Set up your business
            </Link>
          </div>
          <p className="mt-5 text-sm text-ink-muted">Works with your Google Business Profile. Free while in beta.</p>
        </div>
        <LiveReply />
      </section>

      {/* The loop */}
      <section className="border-y border-line-soft bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="max-w-xl font-display text-3xl font-semibold text-ink">One loop, from visit to better visits</h2>
          <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {LOOP.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="font-display text-sm font-semibold text-brand-400 tabular">{i + 1}</span>
                <h3 className="mt-2 font-display text-[17px] font-semibold leading-snug text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Feature rows with real UI */}
      <section className="mx-auto max-w-6xl space-y-24 px-5 py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <MessageCircle className="h-6 w-6 text-brand-500" />
            <h2 className="mt-4 font-display text-3xl font-semibold text-ink">Requests that sound like you, not a bot</h2>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-ink-soft">
              Pick the customer and the service they had. ReviewRankr writes a short, personal message with your review link, and opens it in WhatsApp, SMS or email from your own number. Every link is tracked, so you see who opened it and who reviewed.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-[28px] bg-[#E9E2D6] p-4 shadow-lift">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#D7F5C9] p-3 text-[14px] leading-relaxed text-[#1f2d1a] shadow-sm">
              Hi Priya, thank you for coming in for your hair spa today with Simran. If you have a minute, we’d really value your honest feedback on Google:
              <span className="mt-1 block text-[#1a6ab0] underline">glowstudio.in/r/k3Tq9</span>
              <span className="mt-1 block text-right text-[11px] text-[#5d7253]">6:42 pm ✓✓</span>
            </div>
          </div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 rounded-xl3 bg-white p-6 shadow-lift lg:order-1">
            <p className="mb-4 font-display text-[15px] font-semibold text-ink">What customers mention — last 12 months</p>
            <TopicBalance
              praised={[{ topic: 'Staff behaviour', count: 38 }, { topic: 'Haircut quality', count: 22 }, { topic: 'Cleanliness', count: 17 }, { topic: 'Pricing', count: 3 }]}
              criticized={[{ topic: 'Waiting time', count: 9 }, { topic: 'Pricing', count: 6 }, { topic: 'Staff availability', count: 4 }]}
            />
          </div>
          <div className="order-1 lg:order-2">
            <Sparkles className="h-6 w-6 text-violet" />
            <h2 className="mt-4 font-display text-3xl font-semibold text-ink">See past the star rating</h2>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-ink-soft">
              Every review is read for sentiment, the services mentioned, and what went right or wrong. A 4.6 average can hide a waiting-time problem that shows up in one review out of ten — ReviewRankr surfaces it, with a suggested fix.
            </p>
          </div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <RefreshCw className="h-6 w-6 text-brand-500" />
            <h2 className="mt-4 font-display text-3xl font-semibold text-ink">Your profile, in one place</h2>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-ink-soft">
              Keep hours, description, services and photos in ReviewRankr and push them to Google where its API allows. The sync screen shows exactly what Google accepted — and what it didn’t.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl3 bg-white shadow-lift">
            <table className="w-full text-sm">
              <thead className="bg-mist text-left text-xs text-ink-muted">
                <tr><th className="px-5 py-3 font-medium">Section</th><th className="px-3 py-3 font-medium">ReviewRankr</th><th className="px-3 py-3 font-medium">Google</th><th className="px-5 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {[['Business name', '✓', '✓', 'Synced', 'good'], ['Opening hours', '✓', '✓', 'Synced', 'good'], ['Services', '12', '12', 'Synced', 'good'], ['Photos', '25', '18', 'Partial', 'warn'], ['Description', 'Edited', 'Older', 'Needs push', 'info']].map(([a, b, c, d, t]) => (
                  <tr key={a}>
                    <td className="px-5 py-3 font-medium text-ink">{a}</td>
                    <td className="px-3 py-3 tabular text-ink-soft">{b}</td>
                    <td className="px-3 py-3 tabular text-ink-soft">{c}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t === 'good' ? 'bg-leaf-soft text-leaf' : t === 'warn' ? 'bg-amber-soft text-amber' : 'bg-brand-50 text-brand-600'}`}>{d}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-brand-700 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_2fr]">
          <div>
            <ShieldCheck className="h-7 w-7 text-brand-200" />
            <h2 className="mt-4 font-display text-3xl font-semibold">Genuine reviews only</h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3">
            <li><p className="font-display text-lg font-semibold">Customers stay the author</p><p className="mt-1.5 text-sm leading-relaxed text-brand-100">The writing helper only uses what the customer picks and types, including what could be better. They edit it and post it themselves.</p></li>
            <li><p className="font-display text-lg font-semibold">No gating</p><p className="mt-1.5 text-sm leading-relaxed text-brand-100">Every customer gets the same link, whatever their experience — as Google’s policies require.</p></li>
            <li><p className="font-display text-lg font-semibold">You set the rules</p><p className="mt-1.5 text-sm leading-relaxed text-brand-100">Choose by star rating which AI replies post by themselves. Urgent or mixed reviews always wait for you, and you can hold any reply.</p></li>
          </ul>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 pb-4 pt-12 sm:flex-row sm:items-center">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/signup" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700">Set up your business</Link>
        </div>
      </footer>
      <LegalFooter className="max-w-6xl justify-start sm:justify-start" />
    </div>
  );
}
