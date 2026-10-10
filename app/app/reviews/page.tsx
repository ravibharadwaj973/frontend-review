'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { MessageSquareText, Search, X } from 'lucide-react';
import { Button, Drawer, Empty, PageHeader, Segmented, Select, Skeleton } from '@/components/ui';
import { ReviewDetail, ReviewRow, type Review } from '@/components/app/reviews';

type Filter = 'all' | 'unanswered' | 'answered' | 'positive' | 'neutral' | 'negative' | 'direct';

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

function ReviewsInbox() {
  const params = useSearchParams();
  const router = useRouter();
  const wide = useWide();
  const [filter, setFilter] = useState<Filter>((params.get('filter') as Filter) || 'all');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<string | null>(params.get('open'));
  const topic = params.get('topic');
  const rating = params.get('rating');

  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const key = useMemo(() => {
    const s = new URLSearchParams({ filter, sort, limit: String(limit) });
    if (query) s.set('q', query);
    if (topic) s.set('topic', topic);
    if (rating) s.set('rating', rating);
    return `/reviews?${s}`;
  }, [filter, sort, limit, query, topic, rating]);

  const { data, mutate, isLoading } = useSWR(key);
  const reviews: Review[] = data?.reviews || [];
  const counts = data?.counts || {};

  useEffect(() => {
    if (wide && !selected && reviews.length) setSelected(reviews[0]._id);
  }, [wide, reviews, selected]);

  const clearParam = (name: string) => {
    const s = new URLSearchParams(params.toString());
    s.delete(name);
    router.replace(`/app/reviews${s.toString() ? `?${s}` : ''}`);
  };

  return (
    <>
      <PageHeader title="Reviews" subtitle="Google reviews and reviews customers send in ReviewRankr, in one inbox. " />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          value={filter}
          onChange={(v) => { setFilter(v); setLimit(20); }}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            ...(data?.canReply ? [
              { value: 'unanswered' as Filter, label: 'Needs reply', count: counts.unanswered },
              { value: 'answered' as Filter, label: 'Replied', count: counts.answered },
            ] : []),
            { value: 'positive', label: '4–5★', count: counts.positive },
            { value: 'neutral', label: '3★', count: counts.neutral },
            { value: 'negative', label: '1–2★', count: counts.negative },
            { value: 'direct', label: 'In app', count: counts.direct },
          ]}
        />
        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input className="field h-9 pl-9 text-sm" placeholder="Search text or name" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 w-36 py-1 text-sm" aria-label="Sort">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="lowest">Lowest rated</option>
            <option value="highest">Highest rated</option>
          </Select>
        </div>
      </div>

      {(topic || rating) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {topic && <button onClick={() => clearParam('topic')} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-sm text-white">Mentions “{topic}” <X className="h-3.5 w-3.5" /></button>}
          {rating && <button onClick={() => clearParam('rating')} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-sm text-white">{rating}★ only <X className="h-3.5 w-3.5" /></button>}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <section className={`overflow-hidden rounded-xl2 border border-line-soft bg-paper shadow-lift transition-opacity ${isLoading && data ? 'opacity-60' : ''}`}>
          {!data ? (
            <div className="space-y-4 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : reviews.length === 0 ? (
            <Empty icon={<MessageSquareText className="h-5 w-5" />} title={counts.all ? 'No reviews match these filters' : 'No reviews yet'}>
              {counts.all ? 'Try another filter or clear your search.' : 'Connect your Google Business Profile to import reviews, or send your first review request.'}
            </Empty>
          ) : (
            <>
              {reviews.map((r) => (
                <ReviewRow key={r._id} canReply={data.canReply === true} review={r} selected={selected === r._id} onOpen={() => setSelected(r._id)} />
              ))}
              {data.total > reviews.length && (
                <div className="p-4 text-center">
                  <Button variant="secondary" onClick={() => setLimit((l) => l + 20)}>Show more ({data.total - reviews.length} left)</Button>
                </div>
              )}
            </>
          )}
        </section>

        {wide && (
          <aside className="thin-scroll sticky top-6 max-h-[calc(100vh-48px)] overflow-y-auto rounded-xl2 bg-mist">
            {selected ? <ReviewDetail reviewId={selected} onClose={() => setSelected(null)} onChanged={() => mutate()} /> : <Empty title="Select a review" />}
          </aside>
        )}
      </div>

      {!wide && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} label="Review">
          {selected && <ReviewDetail reviewId={selected} onClose={() => setSelected(null)} onChanged={() => mutate()} />}
        </Drawer>
      )}
    </>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense>
      <ReviewsInbox />
    </Suspense>
  );
}
