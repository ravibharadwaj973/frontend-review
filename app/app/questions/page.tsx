'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Check, ExternalLink, HelpCircle, Info, Megaphone, MessageSquareQuote, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { AiMark, Badge, Button, Empty, Field, Input, Modal, PageHeader, Panel, Skeleton, Textarea, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { cx } from '@/lib/format';

type Q = {
  _id: string;
  question: string;
  answer: string;
  status: 'suggested' | 'answered';
  source: 'ai' | 'reviews' | 'manual';
  needsInput: boolean;
  aiDrafted: boolean;
  post?: { _id: string; status: string } | null;
};

function QuestionCard({ q, onChanged }: { q: Q; onChanged: () => void }) {
  const toast = useToast();
  const [answer, setAnswer] = useState(q.answer || '');
  const [question, setQuestion] = useState(q.question);
  const [busy, setBusy] = useState('');
  const [aiText, setAiText] = useState(false);
  useEffect(() => {
    setAnswer(q.answer || '');
    setQuestion(q.question);
    setAiText(q.status === 'suggested' && q.aiDrafted && !!q.answer);
  }, [q._id, q.answer, q.question, q.status, q.aiDrafted]);

  const dirty = answer.trim() !== (q.answer || '').trim() || question.trim() !== q.question;
  const run = async (key: string, fn: () => Promise<any>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const save = () => run('save', async () => {
    await api(`/questions/${q._id}`, { method: 'PATCH', body: { question: question.trim(), answer: answer.trim(), status: answer.trim() ? 'answered' : 'suggested' } });
    toast(answer.trim() ? 'Answer saved — AI will use it from now on' : 'Saved');
    onChanged();
  });
  const draft = () => run('ai', async () => {
    const res = await api(`/questions/${q._id}/draft-answer`, { method: 'POST' });
    if (res.needsInput || !res.answer) toast('Your profile doesn’t say — only you can answer this one', 'info');
    else {
      setAnswer(res.answer);
      setAiText(true);
    }
  });
  const share = () => run('share', async () => {
    await api(`/questions/${q._id}/share`, { method: 'POST' });
    toast('Post drafted — review it in Google posts');
    onChanged();
  });
  const remove = () => run('del', async () => {
    if (q.status === 'suggested') await api(`/questions/${q._id}`, { method: 'PATCH', body: { status: 'dismissed' } });
    else await api(`/questions/${q._id}`, { method: 'DELETE' });
    onChanged();
  });

  return (
    <li className="rounded-xl2 border border-line-soft bg-paper p-4 shadow-lift">
      <div className="flex items-start gap-3">
        <HelpCircle className="mt-2 h-4 w-4 shrink-0 text-brand-400" />
        <div className="min-w-0 flex-1">
          <input
            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-[16px] font-semibold text-ink hover:border-line focus:border-brand-400 focus:outline-none"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            aria-label="Question"
          />
          <div className="mt-1 flex flex-wrap gap-1.5 px-2">
            {q.source === 'reviews' && <Badge tone="info"><MessageSquareQuote className="h-3 w-3" />From your reviews</Badge>}
            {q.needsInput && !answer && <Badge tone="warn">Only you know this</Badge>}
            {q.status === 'answered' && !dirty && <Badge tone="good"><Check className="h-3 w-3" />Used by AI</Badge>}
          </div>
          <div className={cx('mt-3 rounded-xl p-3', aiText ? 'ai-sheen' : 'bg-mist')}>
            {aiText && <AiMark label="AI suggestion — check it’s right" className="mb-1" />}
            <Textarea
              rows={2}
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setAiText(false);
              }}
              placeholder="Type the answer in a sentence or two"
              className="border-0 bg-transparent px-1 focus:ring-0"
              aria-label="Answer"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(dirty || (q.status === 'suggested' && answer.trim())) && <Button size="sm" onClick={save} loading={busy === 'save'} disabled={!question.trim()} icon={<Check className="h-3.5 w-3.5" />}>{q.status === 'suggested' ? 'Save answer' : 'Save'}</Button>}
            {!answer.trim() && <Button size="sm" variant="ai" onClick={draft} loading={busy === 'ai'} icon={<Wand2 className="h-3.5 w-3.5" />}>Answer with AI</Button>}
            {q.status === 'answered' && !dirty && (q.post ? (
              <Link href="/app/posts"><Button size="sm" variant="secondary" icon={<Megaphone className="h-3.5 w-3.5" />}>{q.post.status === 'published' ? 'Shared as a post' : 'Post drafted'}</Button></Link>
            ) : (
              <Button size="sm" variant="secondary" onClick={share} loading={busy === 'share'} icon={<Megaphone className="h-3.5 w-3.5" />}>Share as Google post</Button>
            ))}
            <Button size="sm" variant="ghost" className="ml-auto text-ink-faint hover:text-rose" onClick={remove} loading={busy === 'del'} icon={<Trash2 className="h-3.5 w-3.5" />}>{q.status === 'suggested' ? 'Not relevant' : 'Delete'}</Button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function QuestionsPage() {
  const toast = useToast();
  const { data, mutate } = useSWR('/questions');
  const [busy, setBusy] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ question: '', answer: '' });

  const suggest = async () => {
    setBusy('suggest');
    try {
      const res = await api('/questions/suggest', { method: 'POST' });
      toast(res.created ? `${res.created} questions added` : 'No new questions found');
      mutate();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };
  const add = async () => {
    setBusy('add');
    try {
      await api('/questions', { body: form });
      setForm({ question: '', answer: '' });
      setAdding(false);
      mutate();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const qs: Q[] = data?.questions || [];
  const open = qs.filter((q) => q.status === 'suggested');
  const answered = qs.filter((q) => q.status === 'answered');

  return (
    <>
      <PageHeader
        title="Customer questions"
        subtitle="Answer what people ask before they visit — parking, prices, booking, timings. AI uses your answers when it replies to reviews and writes posts, and you can share any answer as a Google post."
        actions={
          <>
            <Button variant="secondary" onClick={() => setAdding(true)} icon={<Plus className="h-4 w-4" />}>Add question</Button>
            <Button variant="ai" onClick={suggest} loading={busy === 'suggest'} icon={<Sparkles className="h-4 w-4" />}>Suggest questions</Button>
          </>
        }
      />

      <div className="mb-6 flex gap-3 rounded-xl2 border border-line-soft bg-white px-5 py-4 text-sm text-ink-soft">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <p>
          <span className="font-medium text-ink">About Google’s Q&amp;A section.</span> Google stopped letting apps answer Q&amp;A questions in November 2025 and is moving to AI answers built from your profile, posts and reviews. That’s why answers here go into your posts and review replies. To answer a question someone typed on Google itself, open your profile on Google.{' '}
          <a href="https://business.google.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:underline">Open Google Business Profile<ExternalLink className="h-3 w-3" /></a>
        </p>
      </div>

      {!data ? (
        <div className="space-y-3"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
      ) : qs.length === 0 ? (
        <Panel>
          <Empty icon={<HelpCircle className="h-6 w-6" />} title="No questions yet" action={<Button variant="ai" onClick={suggest} loading={busy === 'suggest'} icon={<Sparkles className="h-4 w-4" />}>Suggest questions</Button>}>
            AI looks at your services and reviews and lists what customers usually ask, with draft answers where your profile already says.
          </Empty>
        </Panel>
      ) : (
        <div className="grid items-start gap-8 xl:grid-cols-2">
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Needs an answer <span className="text-ink-faint">· {open.length}</span></h2>
            {open.length ? <ul className="space-y-3">{open.map((q) => <QuestionCard key={q._id} q={q} onChanged={() => mutate()} />)}</ul> : <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-ink-muted">All caught up.</p>}
          </section>
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Answered <span className="text-ink-faint">· {answered.length}</span></h2>
            {answered.length ? <ul className="space-y-3">{answered.map((q) => <QuestionCard key={q._id} q={q} onChanged={() => mutate()} />)}</ul> : <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-ink-muted">Answers you save appear here.</p>}
          </section>
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a question"
        footer={<><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={add} loading={busy === 'add'} disabled={form.question.trim().length < 3}>Add</Button></>}
      >
        <div className="space-y-4">
          <Field label="Question"><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Do you take walk-ins on Sundays?" autoFocus /></Field>
          <Field label="Answer" hint="Leave empty to answer later"><Textarea rows={3} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></Field>
        </div>
      </Modal>
    </>
  );
}
