// src/types/next-auth.d.ts
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      id: string; // 👈 add this
    };
  }

  interface User {
    id: string;
  }

  interface JWT {
    sub: string;
  }
}
