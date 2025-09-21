// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { UserProvider } from '@/contexts/UserContext';
import { SearchProvider } from '@/contexts/SearchContext';
import Navbar from '@/components/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Card Rewards Optimizer',
  description: 'Find the best credit card for any purchase',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserProvider>
            <SearchProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
              </div>
            </SearchProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
