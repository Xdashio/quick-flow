import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Manager Dashboard — QuickFlow POS', template: '%s — QuickFlow POS' },
  description: 'Kenya M-Pesa-first POS — Manager Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
