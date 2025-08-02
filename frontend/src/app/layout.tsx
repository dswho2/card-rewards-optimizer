// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import AuthLayout from '@/components/AuthLayout';

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
          <AuthLayout>
            {children}
          </AuthLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
