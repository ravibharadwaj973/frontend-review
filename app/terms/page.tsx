import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, type Section } from '@/components/public/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms for using ${LEGAL.product}.`,
};

const P = LEGAL.product;

const sections: Section[] = [
  {
    id: 'agreement',
    title: 'Agreement',
    body: (
      <p>These terms apply to your use of {P} ({LEGAL.website}), run by {LEGAL.operator}. By creating an account or using {P}, you agree to them on behalf of yourself and the business you represent. If you don’t agree, please don’t use {P}.</p>
    ),
  },
  {
    id: 'service',
    title: 'What Starling does',
    body: (
      <p>{P} helps local businesses ask customers for reviews, read and reply to Google reviews, use AI to draft replies, posts and answers, manage their Google Business Profile (hours, photos, posts, services), and see insights from reviews. Some features need a connected Google Business Profile. We may improve, change or remove features over time.</p>
    ),
  },
  {
    id: 'accounts',
    title: 'Your account',
    body: (
      <ul>
        <li>Give accurate information and keep your password safe. You are responsible for activity on your account.</li>
        <li>Only connect Google Business Profiles you own or are authorised to manage.</li>
        <li>Tell us straight away at <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> if you think someone else has used your account.</li>
      </ul>
    ),
  },
  {
    id: 'genuine-reviews',
    title: 'Genuine reviews only',
    body: (
      <>
        <p>{P} is built for honest reviews from real customers. You agree not to use it to:</p>
        <ul>
          <li>write, buy or post fake reviews, or reviews by people who were not customers;</li>
          <li>offer money, discounts, gifts or other rewards in exchange for reviews;</li>
          <li>ask only happy customers for reviews, or discourage or block negative ones (“review gating”);</li>
          <li>post reviews on a customer’s behalf — customers always post their own reviews;</li>
          <li>break Google’s policies, including the Google Maps user-contributed content policy and Business Profile guidelines.</li>
        </ul>
        <p>We may pause or close accounts that do this.</p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <ul>
        <li>Only contact customers who have given you permission, and follow the law on messaging (including spam and telecom rules).</li>
        <li>Don’t upload content that is illegal, misleading, hateful, or that you don’t have the rights to (including photos).</li>
        <li>Don’t try to break, overload, copy or get around the security of {P}, or access other businesses’ data.</li>
      </ul>
    ),
  },
  {
    id: 'ai',
    title: 'AI-written content',
    body: (
      <p>AI drafts can be wrong or incomplete. You are responsible for what is published from your account — review replies, posts, profile details and answers — including replies your own reply rules post automatically. Check important facts such as prices, timings and offers before they go out.</p>
    ),
  },
  {
    id: 'google',
    title: 'Google Business Profile',
    body: (
      <p>When you connect Google, you allow {P} to read and update your Business Profile as described in our <Link href="/privacy-policy">Privacy Policy</Link>. Your use of Google’s services is also subject to Google’s own terms. Google may change or limit its APIs, and some features may stop working as a result. Google decides what appears on Google; we cannot guarantee that a reply, photo, post or edit will be accepted or shown.</p>
    ),
  },
  {
    id: 'your-data',
    title: 'Your content and data',
    body: (
      <p>You own the content and data you add to {P}. You give us permission to store, process and display it only to provide the service to you, as explained in the <Link href="/privacy-policy">Privacy Policy</Link>. You are responsible for having the right to add your customers’ details.</p>
    ),
  },
  {
    id: 'payment',
    title: 'Plans, trials and payment',
    body: (
      <ul>
        <li>New accounts may get a free trial. After it, using {P} needs a paid plan at the price shown on your Billing page.</li>
        <li>Prices, discounts and billing periods for your account are shown on your Billing page. Bills are due by the date shown on each bill.</li>
        <li>Payments are made by UPI, bank transfer, cash or another method we agree. Please send the payment reference so we can confirm it.</li>
        <li>If a bill is not paid, we may pause your account until it is paid. Your data is kept while the account is paused.</li>
        <li>Amounts paid are not refundable, except where required by law or where we agree otherwise in writing. Taxes are added where applicable.</li>
        <li>We may change prices with at least 30 days’ notice; changes apply from your next billing period.</li>
      </ul>
    ),
  },
  {
    id: 'ending',
    title: 'Pausing and closing accounts',
    body: (
      <p>You can stop using {P} at any time and ask us to delete your account. We may pause or close an account that breaks these terms, is unpaid, or puts other users or the service at risk. Where reasonable, we will tell you first. After an account is closed we delete its data as described in the Privacy Policy.</p>
    ),
  },
  {
    id: 'ip',
    title: 'Our service',
    body: <p>{P}, including its software, design and name, belongs to us. These terms give you the right to use it for your business while your account is active; they don’t transfer ownership.</p>,
  },
  {
    id: 'warranty',
    title: 'No guarantees',
    body: (
      <p>We work to keep {P} reliable, but it is provided “as is” and “as available”. We don’t guarantee that it will always be available or error-free, or any particular result, such as more reviews, higher ratings or better search ranking.</p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <p>To the extent the law allows, we are not liable for indirect or consequential losses, lost profits or lost data, and our total liability for any claim is limited to the amount you paid us in the 3 months before the claim. Nothing in these terms limits liability that cannot be limited by law.</p>
    ),
  },
  {
    id: 'indemnity',
    title: 'Your responsibility to us',
    body: <p>You agree to cover any claims, losses or costs arising from your content, your messages to customers, or your breach of these terms or of Google’s policies.</p>,
  },
  {
    id: 'law',
    title: 'Governing law',
    body: <p>These terms are governed by the laws of {LEGAL.country}, and disputes will be handled by the courts of {LEGAL.country}.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: <p>We may update these terms. We will change the effective date above and tell you about important changes. Using {P} after the change means you accept the new terms.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={<p>Please read these terms carefully. They explain your rights and responsibilities when you use {P}.</p>}
      sections={sections}
    />
  );
}
