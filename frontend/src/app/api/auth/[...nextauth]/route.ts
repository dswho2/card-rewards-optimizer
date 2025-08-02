import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

const users = [
  { id: '1', username: 'admin', passwordHash: '$2b$10$jvGvL8F7ikzAOmi.8EoL9uWPl6KcaPSP5wkOJRxecUkROmD8Dj6rO' }, // password: admin
];

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const user = users.find(u => u.username === credentials?.username);
        if (!user) return null;

        const isValid = await compare(credentials!.password, user.passwordHash);
        if (!isValid) return null;

        return { id: user.id, name: user.username };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login', // optional: use modal instead
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
