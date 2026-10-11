import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from './providers';

const sans = localFont({
  src: '../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2',
  variable: '--font-sans',
  weight: '400 700',
  display: 'swap',
});
const display = localFont({
  src: '../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2',
  variable: '--font-display',
  weight: '200 800',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'ReviewRankr — reviews and reputation for local businesses', template: '%s · ReviewRankr' },
  description: 'Ask customers for genuine Google reviews, reply faster with AI, and learn what people actually say about your business.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = { themeColor: '#1F5AD6', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
