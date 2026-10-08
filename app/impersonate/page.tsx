'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui';
import { beginAdminSession } from '@/lib/auth';

/**
 * Landing page for "Open as business" from the admin website.
 * The link carries a short-lived token after # (never sent to any server).
 */
export default function ImpersonatePage() {
  const [error, setError] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');
    if (!token) {
      setError('This link is missing its sign-in token. Open the business again from the admin website.');
      return;
    }
    beginAdminSession(token, params.get('back'));
    // replace() drops the token from history
    window.location.replace('/app');
  }, []);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      {error ? <p className="max-w-sm text-ink-soft">{error}</p> : <><Spinner /><p className="text-sm text-ink-muted">Opening the business…</p></>}
    </div>
  );
}
