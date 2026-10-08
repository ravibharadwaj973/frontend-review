import type { Metadata } from 'next';
import { LegalPage, type Section } from '@/components/public/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${LEGAL.product} collects, uses and protects information, including data from Google Business Profile.`,
};

const P = LEGAL.product;

const sections: Section[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <>
        <p>{P} ({LEGAL.website}) is a tool for local businesses to collect genuine customer reviews, reply to Google reviews, and keep their Google Business Profile up to date. It is run by {LEGAL.operator}, {LEGAL.country}.</p>
        <p>In this policy, “business” or “you” means the business owner or staff using {P}. “Customer” means a person who visits a business and may leave a review.</p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'Information we collect',
    body: (
      <>
        <h3>From businesses</h3>
        <ul>
          <li><strong>Account details:</strong> name, email address and password (we store only a one-way scrambled version of the password).</li>
          <li><strong>Business profile:</strong> business name, category, address, phone, opening hours, services and prices, description, links, staff names, photos and posts you add.</li>
          <li><strong>Customer list you add:</strong> names, phone numbers, email addresses, visits and services of your customers, which you enter or import so you can ask them for reviews.</li>
          <li><strong>Billing records:</strong> your plan, bills and the payment details you or we record (amount, method such as UPI or cash, reference number). We do not collect card or bank login details.</li>
        </ul>
        <h3>From customers</h3>
        <ul>
          <li>When a customer opens a review link or QR code, we record that the link was opened.</li>
          <li>If a customer uses the review page, we receive what they choose to enter: star rating, services, what they liked, their own words and an optional name. If they submit a review inside {P}, it is shared with that business.</li>
        </ul>
        <h3>Automatically</h3>
        <ul>
          <li>Technical logs such as IP address, browser type and the pages requested, used to keep the service secure, prevent abuse (for example, rate limiting) and fix problems.</li>
          <li>We store your sign-in token in your browser’s local storage so you stay signed in. We do not use advertising or tracking cookies.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'google-data',
    title: 'Google user data',
    body: (
      <>
        <p>If you choose to connect your Google Business Profile, you sign in with Google and allow {P} access through the <code>business.manage</code> permission. With it we can:</p>
        <ul>
          <li>read your Business Profile accounts and locations (name, address, hours, phone, website, description, services, photos);</li>
          <li>read the reviews on your profile and your replies to them;</li>
          <li>publish, edit or delete review replies — only replies you approve, or that your own reply rules in {P} allow to post automatically;</li>
          <li>update profile details you change in {P} (such as hours, holiday hours, description, phone, website and services);</li>
          <li>upload photos you add and publish posts you approve or schedule.</li>
        </ul>
        <p><strong>How we use it.</strong> Only to show your reviews and profile inside {P}, analyse your reviews for you, draft replies and posts, and carry out the actions above that you request or set up. We also see the Google account email you connect, to show which account is linked.</p>
        <p><strong>What we never do.</strong> We do not sell Google user data. We do not use it for advertising, and we do not transfer it to advertising platforms, data brokers or information resellers. We do not use it to develop, improve or train generalised AI or machine-learning models. People at {P} do not read it, except when you ask us for help with a specific item, when needed for security or to comply with the law.</p>
        <p><strong>Limited Use.</strong> {P}’s use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
        <p><strong>Storage and removal.</strong> Google access tokens are encrypted when stored (AES-256-GCM). You can disconnect Google at any time in {P} under <em>Google profile → Disconnect</em>, or at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">myaccount.google.com/permissions</a>. When you disconnect, we delete the tokens and stop all access. To delete reviews and other data we copied from Google, delete your account or email us (see “Your choices and rights”).</p>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How we use information',
    body: (
      <ul>
        <li>To provide {P}: show reviews, write AI drafts of replies, review requests, posts and answers, send review requests the business chooses to send, publish to Google, and show analytics.</li>
        <li>To manage accounts and billing: trials, plans, bills, payment confirmation and payment reminders.</li>
        <li>To keep the service secure and working: preventing abuse, fixing errors, and backups.</li>
        <li>To contact businesses about their account, bills or important changes.</li>
      </ul>
    ),
  },
  {
    id: 'ai',
    title: 'AI processing',
    body: (
      <>
        <p>{P} uses an AI service (currently Groq) to analyse review text and write drafts. To do this we send the relevant text — for example a review, your business name and services, or a customer’s chosen review topics — to the AI provider, which returns the result. We send only what is needed for that task. AI-written text is a suggestion: businesses can edit it, and customers always post their own reviews themselves.</p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share information with',
    body: (
      <>
        <p>We do not sell personal information. We share it only with service providers who help us run {P}, under their own security and privacy terms:</p>
        <ul>
          <li><strong>Google</strong> — to read and update your Business Profile when you connect it.</li>
          <li><strong>Groq</strong> — AI processing described above.</li>
          <li><strong>MongoDB Atlas</strong> — database hosting.</li>
          <li><strong>Amazon Web Services</strong> — server hosting and file storage.</li>
          <li><strong>Vercel</strong> — website hosting.</li>
        </ul>
        <p>When a business sends a review request by WhatsApp, SMS or email, {P} opens that app on the business’s own device; the message is sent by the business, not by us. We may also disclose information if required by law, or to protect the rights and safety of users and the public.</p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep information',
    body: (
      <p>We keep account data while your account is active. If you delete your account, we delete your business data — including reviews, customers, photos and Google tokens — within 30 days, except billing records we must keep for tax and legal reasons. Technical logs are kept for a limited time for security.</p>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>Connections use HTTPS. Passwords are stored as one-way hashes, and Google tokens are encrypted. Access to production systems is limited to the people who run {P}. No system is perfectly secure, but we work to protect your information and will tell affected users about a breach as required by law.</p>
    ),
  },
  {
    id: 'rights',
    title: 'Your choices and rights',
    body: (
      <>
        <ul>
          <li>Businesses can view and edit their information in {P} at any time, and edit or delete their customers and other records.</li>
          <li>You can disconnect Google at any time (see “Google user data”).</li>
          <li>You can ask us to access, correct or delete your personal information, or to delete your account, by emailing <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. We reply within 30 days.</li>
          <li>Customers who want their details removed from a business’s list can contact that business, or email us and we will pass on or act on the request.</li>
        </ul>
        <p>We follow applicable Indian law, including the Digital Personal Data Protection Act, 2023.</p>
      </>
    ),
  },
  {
    id: 'businesses',
    title: 'Businesses’ responsibilities',
    body: (
      <p>Businesses decide which customer details to add and whom to contact. They are responsible for having their customers’ permission to contact them and for keeping that information accurate. {P} processes customer details on the business’s behalf.</p>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>{P} is meant for businesses and is not directed at children under 18. We do not knowingly collect information from children.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: <p>We may update this policy. We will change the effective date above and, for important changes, tell businesses by email or in the app.</p>,
  },
  {
    id: 'contact',
    title: 'Contact and grievances',
    body: (
      <p>For privacy questions, requests or complaints, email <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. Grievance contact: {LEGAL.operator}.</p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={<p>This policy explains what information {P} collects, how we use it — including data from Google when you connect your Google Business Profile — and the choices you have.</p>}
      sections={sections}
    />
  );
}
