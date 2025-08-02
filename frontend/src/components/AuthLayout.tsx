// src/components/AuthLayout.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import Navbar from './navbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Navbar />
      {children}
    </SessionProvider>
  );
}
