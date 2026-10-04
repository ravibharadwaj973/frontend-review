'use client';

import { SWRConfig } from 'swr';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ui';
import { fetcher } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, keepPreviousData: true }}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </SWRConfig>
  );
}
