'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import QRCode from 'qrcode';
import { MessageCircle } from 'lucide-react';
import { Panel } from '@/components/ui';
import { useAuth } from '@/lib/auth';

/** Small dashboard card: the business QR code with quick share/download. */
export function QrCard() {
  const { business } = useAuth();
  const { data } = useSWR('/business/share');
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (data?.url) QRCode.toDataURL(data.url, { width: 360, margin: 1, errorCorrectionLevel: 'H', color: { dark: '#143A8C', light: '#FFFFFF' } }).then(setSrc);
  }, [data?.url]);
  const text = `Hi! Thanks for visiting ${business?.name}. We’d really value your honest feedback — it takes about a minute: ${data?.url}`;
  return (
    <Panel title="Your QR code" action={<Link href="/app/share" className="text-sm font-medium text-brand-600 hover:underline">Download</Link>}>
      <div className="flex items-center gap-4">
        <Link href="/app/share" className="shrink-0 rounded-xl border border-line-soft p-2" aria-label="Open QR code page">
          {src ? <img src={src} alt="Business review QR code" className="h-24 w-24" /> : <div className="skeleton h-24 w-24" />}
        </Link>
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-ink-muted">Customers scan it to review you on Google.</p>
          <p className="text-xs text-ink-faint tabular">{data?.stats?.opens ?? 0} scans · {data?.stats?.clicks ?? 0} went to Google</p>
          {data?.url && (
            <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-[13px] font-medium text-white hover:brightness-95">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </Panel>
  );
}
