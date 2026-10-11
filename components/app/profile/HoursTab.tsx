'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Copy, Plus, X } from 'lucide-react';
import { Badge, Button, Input, Panel } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { DAYS } from '@/lib/constants';
import { cx } from '@/lib/format';


import { useBusinessDraft, SaveBar } from './shared';

/** Seven-day open/close editor, used for regular and seasonal hours. */
function WeekHoursEditor({ hours, onChange, label }: { hours: any[]; onChange: (h: any[]) => void; label?: string }) {
  const setDay = (i: number, patch: any) => onChange(hours.map((h: any, j: number) => (j === i ? { ...h, ...patch } : h)));
  const copyToAll = (i: number) => onChange(hours.map((h: any) => (h.closed ? h : { ...h, open: hours[i].open, close: hours[i].close })));
  return (
    <ul className="divide-y divide-line-soft">
      {DAYS.map((day) => {
        const i = hours.findIndex((h: any) => h.day === day);
        const h = hours[i];
        if (!h) return null;
        return (
          <li key={day} className="flex flex-wrap items-center gap-3 py-2.5">
            <span className="w-24 text-sm font-medium capitalize">{day}</span>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={!h.closed} onChange={(e) => setDay(i, { closed: !e.target.checked })} className="h-4 w-4 accent-brand-500" /> Open
            </label>
            {h.closed ? (
              <span className="text-sm text-ink-faint">Closed</span>
            ) : (
              <div className="flex items-center gap-2">
                <Input type="time" value={h.open} onChange={(e) => setDay(i, { open: e.target.value })} className="h-9 w-[136px] py-1" aria-label={`${label ? `${label} ` : ''}${day} opens`} />
                <span className="text-ink-faint">to</span>
                <Input type="time" value={h.close} onChange={(e) => setDay(i, { close: e.target.value })} className="h-9 w-[136px] py-1" aria-label={`${label ? `${label} ` : ''}${day} closes`} />
                <button onClick={() => copyToAll(i)} className="rounded-lg p-1.5 text-ink-faint hover:bg-mist hover:text-brand-600" title="Copy to all open days" aria-label="Copy to all open days"><Copy className="h-4 w-4" /></button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const niceDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

export default function HoursTab() {
  const { business } = useAuth();
  const { draft, setDraft, save, saving, dirty } = useBusinessDraft();
  const { data: hol } = useSWR('/business/holidays');
  const { data: google } = useSWR('/google/status');
  const [openSeason, setOpenSeason] = useState<number | null>(null);
  if (!draft) return null;
  const today = todayYmd();
  const special = [...(draft.specialHours || [])];
  const seasons = draft.seasonalHours || [];
  const setSpecial = (list: any[]) => setDraft({ ...draft, specialHours: [...list].sort((a, b) => String(a.date).localeCompare(String(b.date))) });
  const setSeasons = (list: any[]) => setDraft({ ...draft, seasonalHours: list });
  const past = special.filter((s: any) => s.date < today);
  const suggestions = (hol?.holidays || []).filter((h: any) => !special.some((s: any) => s.date === h.date) && h.daysAway <= 90).slice(0, 6);
  const addHoliday = (h: any, closed: boolean) => setSpecial([...special, closed ? { date: h.date, closed: true, note: h.name } : { date: h.date, closed: false, open: '10:00', close: '15:00', note: h.name }]);
  const syncOn = draft.automation?.syncHoursToGoogle !== false;
  const connected = !!google?.account;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-ink-soft shadow-lift">
        <span className={cx('h-2 w-2 rounded-full', !connected || !syncOn ? 'bg-ink-faint' : google.account.mode === 'demo' ? 'bg-star' : 'bg-leaf')} />
        <span className="flex-1">
          {!connected ? 'Connect Google and your hours will update there as soon as you save.'
            : !syncOn ? 'Hours are saved here only. Turn on “Update Google when I change hours” in Autopilot to send them.'
            : google.account.mode === 'demo' ? 'Demo connection — saved hours are not sent to Google.'
            : 'When you save, your hours, holiday hours and seasonal timings update on Google straight away.'}
        </span>
        <a href="/app/autopilot" className="font-medium text-brand-600 hover:underline">Autopilot settings</a>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Regular hours">
            <WeekHoursEditor hours={draft.hours} onChange={(hours) => setDraft({ ...draft, hours })} />
          </Panel>

          <Panel
            title="Seasonal hours"
            action={<Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setSeasons([...seasons, { name: 'Summer hours', start: today, end: today, hours: draft.hours.map((h: any) => ({ ...h })) }]); setOpenSeason(seasons.length); }}>Add season</Button>}
          >
            <p className="-mt-2 mb-3 text-sm text-ink-muted">Different timings for part of the year — summer, winter, Ramadan. Google switches to them on the start date and back to your regular hours after the end date, by itself.</p>
            {!seasons.length && <p className="text-sm text-ink-faint">No seasonal hours.</p>}
            <ul className="space-y-3">
              {seasons.map((se: any, i: number) => {
                const upd = (patch: any) => setSeasons(seasons.map((x: any, j: number) => (j === i ? { ...x, ...patch } : x)));
                const active = se.start <= today && today <= se.end;
                const over = se.end < today;
                return (
                  <li key={se._id || i} className="rounded-xl border border-line-soft bg-mist/60 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input value={se.name} onChange={(e) => upd({ name: e.target.value })} className="h-9 w-40 py-1" aria-label="Season name" />
                      <Input type="date" value={se.start} onChange={(e) => upd({ start: e.target.value })} className="h-9 w-auto py-1" aria-label="Starts" />
                      <span className="text-ink-faint">to</span>
                      <Input type="date" value={se.end} min={se.start} onChange={(e) => upd({ end: e.target.value })} className="h-9 w-auto py-1" aria-label="Ends" />
                      {active && <Badge tone="info">On now</Badge>}
                      {over && <Badge>Ended</Badge>}
                      <span className="ml-auto flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setOpenSeason(openSeason === i ? null : i)}>{openSeason === i ? 'Done' : 'Edit hours'}</Button>
                        <Button size="sm" variant="ghost" aria-label="Remove season" onClick={() => setSeasons(seasons.filter((_: any, j: number) => j !== i))} icon={<X className="h-4 w-4" />} />
                      </span>
                    </div>
                    {openSeason === i && <div className="mt-2 rounded-lg bg-white px-3"><WeekHoursEditor label={se.name} hours={se.hours} onChange={(hours) => upd({ hours })} /></div>}
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <Panel
          title="Holidays & special hours"
          action={<Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setSpecial([...special, { date: today, closed: true, note: '' }])}>Add date</Button>}
        >
          {suggestions.length > 0 && (
            <div className="mb-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 p-3">
              <p className="mb-2 text-sm font-medium text-ink">Coming up</p>
              <ul className="space-y-2">
                {suggestions.map((h: any) => (
                  <li key={h.date} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="w-full"><span className="font-medium">{h.name}</span> <span className="text-ink-muted">· {niceDate(h.date)}</span></span>
                    <button onClick={() => addHoliday(h, true)} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-ink-soft ring-1 ring-line hover:text-brand-600">Closed</button>
                    <button onClick={() => addHoliday(h, false)} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-ink-soft ring-1 ring-line hover:text-brand-600">Short day</button>
                    <button onClick={() => setSpecial([...special, { date: h.date, closed: false, open: draft.hours[0]?.open || '10:00', close: draft.hours[0]?.close || '20:00', note: h.name }])} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-ink-soft ring-1 ring-line hover:text-brand-600">Open as usual</button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-muted">Telling Google you’re open as usual counts too — it shows customers your hours are confirmed.</p>
            </div>
          )}
          <ul className="space-y-3">
            {special.map((s: any, i: number) => {
              const upd = (patch: any) => setSpecial(special.map((x: any, j: number) => (j === i ? { ...x, ...patch } : x)));
              const isPast = s.date < today;
              return (
                <li key={`${s.date}-${i}`} className={cx('rounded-xl bg-mist p-3', isPast && 'opacity-60')}>
                  <div className="flex gap-2">
                    <Input type="date" value={s.date} onChange={(e) => upd({ date: e.target.value })} className="h-9 py-1" aria-label="Date" />
                    <Input placeholder="Diwali" value={s.note || ''} onChange={(e) => upd({ note: e.target.value })} className="h-9 py-1" aria-label="What’s the occasion" />
                    <Button variant="ghost" aria-label="Remove" onClick={() => setSpecial(special.filter((_: any, j: number) => j !== i))} icon={<X className="h-4 w-4" />} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    {/* Unticking "closed" fills in times so Google gets real opening hours */}
                    <label className="flex items-center gap-2"><input type="checkbox" checked={s.closed} onChange={(e) => upd(e.target.checked ? { closed: true } : { closed: false, open: s.open || '10:00', close: s.close || '18:00' })} className="accent-brand-500" />Closed all day</label>
                    {!s.closed && (<><Input type="time" value={s.open || '10:00'} onChange={(e) => upd({ open: e.target.value })} className="h-8 w-[132px] py-0" aria-label="Opens" /><Input type="time" value={s.close || '18:00'} onChange={(e) => upd({ close: e.target.value })} className="h-8 w-[132px] py-0" aria-label="Closes" /></>)}
                    {isPast && <span className="ml-auto text-xs text-ink-muted">Past</span>}
                  </div>
                </li>
              );
            })}
            {!special.length && <li className="text-sm text-ink-faint">No special dates.</li>}
          </ul>
          {past.length > 0 && <button onClick={() => setSpecial(special.filter((s: any) => s.date >= today))} className="mt-3 text-sm font-medium text-brand-600 hover:underline">Remove {past.length} past date{past.length > 1 ? 's' : ''}</button>}
        </Panel>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={() => save(['hours', 'specialHours', 'seasonalHours'])} onReset={() => setDraft(business)} />
    </>
  );
}

/* Services / menu ---------------------------------------------------------- */
