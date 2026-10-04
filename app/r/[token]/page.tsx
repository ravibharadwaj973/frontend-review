'use client';

import { use } from 'react';
import { ReviewHelper } from '@/components/public/ReviewHelper';

/** Personal review link sent to one customer after their visit. */
export default function ReviewRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <ReviewHelper base={`/api/public/r/${encodeURIComponent(token)}`} />;
}
