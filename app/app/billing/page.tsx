'use client';

import { PageHeader } from '@/components/ui';
import { BillingView } from '@/components/app/BillingView';

export default function BillingPage() {
  return (
    <>
      <PageHeader title="Billing" subtitle="Your plan, bills and payments. Pay by UPI or bank transfer, then send us the reference so we can confirm it." />
      <BillingView />
    </>
  );
}
