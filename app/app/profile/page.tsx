'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Segmented, Skeleton } from '@/components/ui';
import LinksTab from '@/components/app/profile/LinksTab';

type Tab = 'audit' | 'info' | 'hours' | 'services' | 'photos' | 'links' | 'description';
const TABS: Tab[] = ['audit', 'info', 'hours', 'services', 'photos', 'links', 'description'];
const TabLoading = () => <Skeleton className="h-64" />;
const ProfileAudit = dynamic(() => import('@/components/app/ProfileAudit').then(mod => mod.ProfileAudit), { loading: TabLoading });
const InfoTab = dynamic(() => import('@/components/app/profile/InfoTab'), { loading: TabLoading });
const HoursTab = dynamic(() => import('@/components/app/profile/HoursTab'), { loading: TabLoading });
const ServicesTab = dynamic(() => import('@/components/app/profile/ServicesTab'), { loading: TabLoading });
const PhotosTab = dynamic(() => import('@/components/app/profile/PhotosTab'), { loading: TabLoading });
const DescriptionTab = dynamic(() => import('@/components/app/profile/DescriptionTab'), { loading: TabLoading });

function ProfileInner() {
  const params = useSearchParams();
  const router = useRouter();
  const requested = params.get('tab');
  const tab: Tab = TABS.includes(requested as Tab) ? requested as Tab : 'audit';
  const change = (t: Tab) => router.replace(`/app/profile?tab=${t}`, { scroll: false });
  return (
    <>
      <PageHeader title="Business profile" subtitle="The details behind your Google listing, your review requests and every AI reply." />
      <div className="mb-6">
        <Segmented<Tab>
          value={tab}
          onChange={change}
          options={[
            { value: 'audit', label: 'Profile audit' },
            { value: 'info', label: 'Basic information' },
            { value: 'hours', label: 'Hours' },
            { value: 'services', label: 'Services / menu' },
            { value: 'photos', label: 'Photos' },
            { value: 'links', label: 'Website & links' },
            { value: 'description', label: 'Description' },
          ]}
        />
      </div>
      {tab === 'audit' && <ProfileAudit />}
      {tab === 'info' && <InfoTab />}
      {tab === 'hours' && <HoursTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'photos' && <PhotosTab />}
      {tab === 'links' && <LinksTab />}
      {tab === 'description' && <DescriptionTab />}
    </>
  );
}

export default function ProfilePage() {
  return <Suspense fallback={<TabLoading />}><ProfileInner /></Suspense>;
}
