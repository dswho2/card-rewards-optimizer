// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { UserProvider } from '@/contexts/UserContext';
import Navbar from '@/components/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Card Rewards Optimizer',
  description: 'Find the best credit card for any purchase',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserProvider>
            <Navbar />
            <main>{children}</main>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
