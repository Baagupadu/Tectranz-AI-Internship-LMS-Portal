import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tectranz · AI Internships Learning & Management Portal',
  description: 'Enterprise LMS and project management portal for Tectranz AI Interns, mentors, and partner engineering teams.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/brand/icon-192.png',
    apple: '/brand/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0C0A33',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(console.error);
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
