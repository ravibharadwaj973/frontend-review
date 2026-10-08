'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';
import { Spinner } from '@/components/ui';
import { InvoiceSheet } from '@/components/app/InvoiceSheet';
import { useAuth } from '@/lib/auth';

/** Printable bill / receipt for the signed-in business. */
export default function PrintBill() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);
  const { data, error } = useSWR(user ? `/billing/invoices/${id}` : null);
  if (error) return <p className="p-10 text-center text-ink-muted">{error.message}</p>;
  if (!data) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;
  return <InvoiceSheet doc={data} />;
}
