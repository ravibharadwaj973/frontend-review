'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import QRCode from 'qrcode';
import { Check, Copy, Download, ExternalLink, FileImage, Mail, MessageCircle, Pencil, Printer, Share2 } from 'lucide-react';
import { Button, Field, Input, PageHeader, Panel, Segmented, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cx, num } from '@/lib/format';

type Style = 'blue' | 'black';
const COLORS: Record<Style, { band: string; qr: string; accent: string }> = {
  blue: { band: '#1F5AD6', qr: '#143A8C', accent: '#1F5AD6' },
  black: { band: '#111C33', qr: '#000000', accent: '#111C33' },
};

const HEADLINES = ['How was your visit?', 'Tell us how we did', 'Your feedback helps us improve'];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx[i ? 'lineTo' : 'moveTo'](cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number, weight: number, family: string) {
  let size = start;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    size -= 2;
  } while (ctx.measureText(text).width > maxWidth && size > 20);
}

/** Draws a printable A-ratio poster (1240 × 1754 px ≈ A5 at 210 dpi) with the business QR code. */
async function drawPoster({ url, name, place, headline, style }: { url: string; name: string; place: string; headline: string; style: Style }) {
  const W = 1240;
  const H = 1754;
  const c = COLORS[style];
  const display = '"Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif';
  const body = '"Instrument Sans Variable", "Instrument Sans", system-ui, sans-serif';
  try {
    await Promise.all([document.fonts.load(`700 80px ${display}`), document.fonts.load(`500 40px ${body}`)]);
  } catch {
    /* fonts optional */
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Top band with business name
  ctx.fillStyle = c.band;
  roundRect(ctx, 0, 0, W, 420, 0);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  fitText(ctx, name, W - 160, 92, 700, display);
  ctx.fillText(name, W / 2, 210);
  if (place) {
    ctx.font = `500 38px ${body}`;
    ctx.globalAlpha = 0.85;
    ctx.fillText(place, W / 2, 280);
    ctx.globalAlpha = 1;
  }

  // Headline
  ctx.fillStyle = '#111C33';
  fitText(ctx, headline, W - 160, 84, 700, display);
  ctx.fillText(headline, W / 2, 560);
  ctx.fillStyle = '#5E6B85';
  ctx.font = `500 40px ${body}`;
  ctx.fillText('Scan to leave us a review on Google', W / 2, 630);

  // QR card
  const qrSize = 640;
  const cardPad = 48;
  const cardX = (W - qrSize) / 2 - cardPad;
  const cardY = 700;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 8;
  roundRect(ctx, cardX, cardY, qrSize + cardPad * 2, qrSize + cardPad * 2, 48);
  ctx.fill();
  ctx.stroke();
  const qrUrl = await QRCode.toDataURL(url, { width: qrSize, margin: 0, errorCorrectionLevel: 'H', color: { dark: c.qr, light: '#FFFFFF' } });
  ctx.drawImage(await loadImage(qrUrl), cardX + cardPad, cardY + cardPad, qrSize, qrSize);

  // Stars
  ctx.fillStyle = '#EFA00B';
  const starY = cardY + qrSize + cardPad * 2 + 100;
  for (let i = 0; i < 5; i += 1) star(ctx, W / 2 + (i - 2) * 92, starY, 36);

  // Footer
  ctx.fillStyle = '#3A4763';
  ctx.font = `500 34px ${body}`;
  ctx.fillText('Point your phone camera at the code', W / 2, starY + 110);
  ctx.fillStyle = '#94A0B7';
  ctx.font = `500 28px ${body}`;
  ctx.fillText(url.replace(/^https?:\/\//, ''), W / 2, H - 70);

  return canvas;
}

function download(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function SharePage() {
  const toast = useToast();
  const { business } = useAuth();
  const { data, mutate } = useSWR('/business/share');
  const [style, setStyle] = useState<Style>('blue');
  const [headline, setHeadline] = useState(HEADLINES[0]);
  const [poster, setPoster] = useState<string>('');
  const [qrPng, setQrPng] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [copied, setCopied] = useState(false);

  const url: string = data?.url || '';
  const name = business?.name || '';
  const place = [business?.category, business?.address?.city].filter(Boolean).join(' · ');
  const fileBase = (data?.slug || 'review') + '-review';
  const shareText = useMemo(() => `Hi! Thanks for visiting ${name}. We’d really value your honest feedback — it takes about a minute: ${url}`, [name, url]);

  const render = useCallback(async () => {
    if (!url) return;
    const canvas = await drawPoster({ url, name, place, headline, style });
    setPoster(canvas.toDataURL('image/png'));
    setQrPng(await QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: 'H', color: { dark: COLORS[style].qr, light: '#FFFFFF' } }));
  }, [url, name, place, headline, style]);

  useEffect(() => {
    render();
  }, [render]);

  const downloadSvg = async () => {
    const svg = await QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'H', color: { dark: COLORS[style].qr, light: '#FFFFFF' } });
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    download(blobUrl, `${fileBase}-qr.svg`);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  };

  const print = () => {
    const w = window.open('', '_blank');
    if (!w) return toast('Allow pop-ups to print the poster', 'bad');
    w.document.write(`<!doctype html><title>${name} — review poster</title><style>@page{size:A5;margin:0}html,body{margin:0;height:100%}img{width:100%;height:100%;object-fit:contain;display:block}</style><img src="${poster}" onload="setTimeout(()=>{window.print()},200)">`);
    w.document.close();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    toast('Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  // Mobile share sheet with the poster image attached (WhatsApp, Instagram, etc.)
  const nativeShare = async () => {
    try {
      const blob = await (await fetch(poster)).blob();
      const file = new File([blob], `${fileBase}-poster.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Review ${name}`, text: shareText });
      } else if (navigator.share) {
        await navigator.share({ title: `Review ${name}`, text: shareText, url });
      } else {
        toast('Sharing isn’t supported in this browser — use WhatsApp or Download instead', 'bad');
      }
    } catch {
      /* user cancelled */
    }
  };

  const saveSlug = async () => {
    setSlugError('');
    try {
      await api('/business/share', { method: 'PATCH', body: { slug } });
      await mutate();
      setEditing(false);
      toast('Link updated — download your QR code again');
    } catch (e: any) {
      setSlugError(e.message);
    }
  };

  const stats = data?.stats || {};

  return (
    <>
      <PageHeader
        title="QR code & sharing"
        subtitle="One link and QR code for your business. Put it on the counter, the bill or your WhatsApp status — anyone can scan it and leave a review on Google."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Poster preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-xl2 border border-line-soft bg-white shadow-lift">
            {poster ? <img src={poster} alt={`Review poster for ${name} with QR code`} className="block w-full" /> : <Skeleton className="aspect-[1240/1754] w-full rounded-none" />}
          </div>
          <p className="mt-2 text-center text-xs text-ink-muted">A5 poster · prints well on A4 or A5</p>
        </div>

        <div className="space-y-6">
          <Panel title="Your review link">
            {!data ? <Skeleton className="h-10" /> : editing ? (
              <div>
                <Field label="Choose your link" error={slugError} hint="Letters, numbers and dashes. Changing it breaks QR codes you’ve already printed.">
                  <div className="flex items-center gap-2">
                    <span className="hidden shrink-0 text-sm text-ink-muted sm:inline">{url.replace(/\/b\/.*/, '/b/')}</span>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} autoFocus />
                  </div>
                </Field>
                <div className="mt-3 flex gap-2"><Button size="sm" onClick={saveSlug}>Save link</Button><Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-mist px-3 py-2.5 text-sm text-ink">{url}</code>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="h-10" onClick={copyLink} icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>{copied ? 'Copied' : 'Copy'}</Button>
                  <Button variant="ghost" size="sm" className="h-10" onClick={() => { setSlug(data.slug); setEditing(true); }} icon={<Pencil className="h-4 w-4" />}>Edit</Button>
                  <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink-soft hover:bg-brand-50" aria-label="Open the review page"><ExternalLink className="h-4 w-4" /></a>
                </div>
              </div>
            )}
            {!data?.reviewLink && data && (
              <p className="mt-3 rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">Connect Google (or add your review link in Settings) so the button on this page leads to your Google review form.</p>
            )}
          </Panel>

          <Panel title="Share">
            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-[15px] font-medium text-white hover:brightness-95"
              >
                <MessageCircle className="h-5 w-5" /> Share on WhatsApp
              </a>
              <Button size="lg" variant="secondary" onClick={nativeShare} icon={<Share2 className="h-4 w-4" />}>Share poster image</Button>
              <a href={`mailto:?subject=${encodeURIComponent(`How was your visit to ${name}?`)}&body=${encodeURIComponent(shareText)}`} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[15px] font-medium text-ink hover:border-brand-200 hover:bg-brand-50">
                <Mail className="h-4 w-4" /> Email
              </a>
              <Button size="lg" variant="secondary" onClick={copyLink} icon={<Copy className="h-4 w-4" />}>Copy link</Button>
            </div>
            <div className="mt-4 rounded-xl bg-mist p-3">
              <p className="text-xs font-medium text-ink-muted">Message that goes with it</p>
              <p className="mt-1 text-sm text-ink-soft">{shareText}</p>
            </div>
            <p className="mt-3 text-xs text-ink-muted">“Share poster image” opens your phone’s share sheet, so you can send the poster straight to a WhatsApp chat, group or status.</p>
          </Panel>

          <Panel title="Download & print">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Colour">
                <Segmented<Style> value={style} onChange={setStyle} options={[{ value: 'blue', label: 'Blue' }, { value: 'black', label: 'Black & white' }]} />
              </Field>
              <Field label="Headline on the poster">
                <select className="field" value={headline} onChange={(e) => setHeadline(e.target.value)}>
                  {HEADLINES.map((h) => <option key={h}>{h}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button size="lg" onClick={() => download(poster, `${fileBase}-poster.png`)} disabled={!poster} icon={<FileImage className="h-4 w-4" />}>Download poster (PNG)</Button>
              <Button size="lg" variant="secondary" onClick={print} disabled={!poster} icon={<Printer className="h-4 w-4" />}>Print poster</Button>
              <Button size="lg" variant="secondary" onClick={() => download(qrPng, `${fileBase}-qr.png`)} disabled={!qrPng} icon={<Download className="h-4 w-4" />}>QR code only (PNG)</Button>
              <Button size="lg" variant="secondary" onClick={downloadSvg} disabled={!url} icon={<Download className="h-4 w-4" />}>QR code only (SVG)</Button>
            </div>
            <p className="mt-3 text-xs text-ink-muted">Use the SVG for large prints like standees or banners — it stays sharp at any size.</p>
          </Panel>

          <Panel title="How it’s doing">
            <dl className="grid grid-cols-2 gap-y-5 text-center sm:grid-cols-4 sm:divide-x sm:divide-line-soft">
              {[
                ['Opened', stats.opens, 'scans and link opens'],
                ['Used writing help', stats.composed, 'drafts made'],
                ['Reviews sent in app', stats.submitted, 'no login needed'],
                ['Went to Google', stats.clicks, 'review form opened'],
              ].map(([label, value, sub]) => (
                <div key={label as string} className="px-2">
                  <dt className="text-[13px] text-ink-muted">{label}</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold tabular">{num(value as number)}</dd>
                  <p className="text-xs text-ink-faint">{sub}</p>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
