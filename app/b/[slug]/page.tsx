'use client';

import { use } from 'react';
import { ReviewHelper } from '@/components/public/ReviewHelper';

/** The business's QR code and shareable review link. */
export default function BusinessReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ReviewHelper base={`/api/public/b/${encodeURIComponent(slug)}`} />;
}
