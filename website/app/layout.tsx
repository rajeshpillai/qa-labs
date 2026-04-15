import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/sidebar-mobile';
import { getAllPhases } from '@/lib/katas';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'QA Labs - Testing Katas',
  description:
    'Master software testing with 44 hands-on katas across 9 progressive phases.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const phases = getAllPhases();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          <div className="flex min-h-screen">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:z-30 lg:w-[280px]">
              <Sidebar phases={phases} />
            </aside>

            {/* Desktop theme toggle (top-right) */}
            <div className="hidden lg:flex fixed top-4 right-4 z-30">
              <ThemeToggle />
            </div>

            {/* Mobile header + sidebar drawer */}
            <MobileHeader phases={phases} />

            {/* Main content */}
            <main className="flex-1 lg:pl-[280px]">
              <div className="mx-auto max-w-4xl px-6 py-8 lg:py-12">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
