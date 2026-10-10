'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, RefreshCw, Search, Sparkles } from 'lucide-react';
import { Badge, Button, Empty, PageHeader, Skeleton, Stars } from '@/components/ui';
import { shortDate, timeAgo } from '@/lib/format';

type GeneratedReview = {
  _id: string;
  text: string;
  model: string;
  rating: number;
  services: string[];
  source: 'link' | 'qr';
  createdAt: string;
};

export default function GeneratedReviewsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, isLoading, mutate } = useSWR(`/reviews/generated?page=${page}&limit=20`, { refreshInterval: 60_000 });
  const reviews: GeneratedReview[] = data?.reviews || [];
  const matching = reviews.filter((review) => [review.text, ...review.services].join(' ').toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <PageHeader title="Generated reviews" actions={<Button variant="secondary" onClick={() => mutate()} loading={isLoading} icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Badge tone="ai">Generated drafts</Badge>
          {data && <span>{data.total} total</span>}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input aria-label="Search this page of generated reviews" className="field h-9 pl-9 text-sm" placeholder="Search this page" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>
      {error ? (
        <Empty title="Couldn't load generated reviews"><Button variant="secondary" onClick={() => mutate()}>Retry</Button></Empty>
      ) : !data ? (
        <div className="space-y-4">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-32" />)}</div>
      ) : matching.length === 0 ? (
        <Empty icon={<Sparkles className="h-5 w-5" />} title={query ? 'No matching drafts' : 'No generated reviews yet'} />
      ) : (
        <ul className="divide-y divide-line-soft border-y border-line-soft">
          {matching.map((review) => (
            <li key={review._id} className="py-5">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Badge tone="ai">Generated draft</Badge>
                <Stars value={review.rating} size={14} />
                <span className="text-xs text-ink-muted">{review.source === 'qr' ? 'QR / business link' : 'Customer review link'}</span>
                <time dateTime={review.createdAt} title={shortDate(review.createdAt)} className="text-xs text-ink-muted">{timeAgo(review.createdAt)}</time>
              </div>
              <p className="max-w-4xl whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink-soft">{review.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {review.services.map((service) => <Badge key={service}>{service}</Badge>)}
                <span className="break-all text-xs text-ink-muted">Groq: {review.model.replace(/^groq:/, '')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data?.total > 20 && (
        <div className="mt-5 flex items-center justify-end gap-3">
          <Button variant="secondary" disabled={page === 1 || isLoading} onClick={() => setPage((current) => current - 1)} icon={<ChevronLeft className="h-4 w-4" />}>Previous</Button>
          <span className="text-sm text-ink-muted">Page {page} of {Math.ceil(data.total / 20)}</span>
          <Button variant="secondary" disabled={page * 20 >= data.total || isLoading} onClick={() => setPage((current) => current + 1)} icon={<ChevronRight className="h-4 w-4" />}>Next</Button>
        </div>
      )}
    </>
  );
}
