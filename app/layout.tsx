import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/instrument-sans';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: { default: 'Starling — reviews and reputation for local businesses', template: '%s · Starling' },
  description: 'Ask customers for genuine Google reviews, reply faster with AI, and learn what people actually say about your business.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = { themeColor: '#1F5AD6', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
