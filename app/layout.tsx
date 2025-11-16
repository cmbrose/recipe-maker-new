import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { MainNav } from '@/components/layout/MainNav';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Recipe Maker',
  description: 'Organize your recipes and plan your meals',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <MainNav />
            <main className="flex-1 container mx-auto py-6">{children}</main>
          </div>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
