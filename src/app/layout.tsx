import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FamiDoc Pro - Bác sĩ Gia đình Toàn diện',
  description: 'Nền tảng Y tế & Bác sĩ Gia đình Cho Mọi Nhà',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-on-background antialiased">
        {children}
      </body>
    </html>
  );
}
